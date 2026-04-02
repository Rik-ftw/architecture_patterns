const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { runTriagePipeline, runSingleStage, STAGES } = require('../langchainTriage');

const activeStreams = new Map();

router.post('/triage', async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    const result = await pool.query(
      'SELECT * FROM intake_requests WHERE id::text=$1 OR reference_id=$1',
      [requestId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Intake not found' });
    const row = result.rows[0];

    if (row.status === 'Draft') {
      return res.status(400).json({ error: 'Cannot triage a Draft intake. Submit it first.' });
    }

    const streamKey = String(row.id);
    const stageEvents = [];

    const onStageUpdate = (stage, event, data) => {
      const payload = { stage, event, data, timestamp: new Date().toISOString() };
      stageEvents.push(payload);
      const clients = activeStreams.get(streamKey) || [];
      clients.forEach(client => {
        try {
          client.write(`data: ${JSON.stringify(payload)}\n\n`);
        } catch {}
      });
    };

    await pool.query(
      `UPDATE intake_requests SET triage_status='running', triage_started_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [row.id]
    );
    onStageUpdate('pipeline', 'start', { intakeId: row.id, referenceId: row.reference_id });

    const triageResult = await runTriagePipeline(row, onStageUpdate);

    const triagePayload = JSON.stringify(triageResult);
    await pool.query(
      `UPDATE intake_requests SET
        triage_result=$1,
        triage_status=$2,
        triage_routing_lane=$3,
        triage_composite_score=$4,
        triage_risk_tier=$5,
        triage_completed_at=NOW(),
        updated_at=NOW()
       WHERE id=$6`,
      [
        triagePayload,
        triageResult.halted ? 'halted' : 'complete',
        triageResult.routingLane || null,
        triageResult.compositeScore || null,
        triageResult.riskTier || null,
        row.id
      ]
    );

    onStageUpdate('pipeline', 'complete', {
      halted: triageResult.halted,
      routingLane: triageResult.routingLane,
      compositeScore: triageResult.compositeScore,
    });

    const clients = activeStreams.get(streamKey) || [];
    clients.forEach(client => {
      try { client.end(); } catch {}
    });
    activeStreams.delete(streamKey);

    res.json({ success: true, triage: triageResult });
  } catch (err) {
    console.error('Triage pipeline error:', err);
    if (req.body && req.body.requestId) {
      try {
        const r = await pool.query(
          'SELECT id FROM intake_requests WHERE id::text=$1 OR reference_id=$1',
          [req.body.requestId]
        );
        if (r.rows.length) {
          await pool.query(
            `UPDATE intake_requests SET triage_status='failed', updated_at=NOW() WHERE id=$1`,
            [r.rows[0].id]
          );
        }
      } catch {}
    }
    res.status(500).json({ error: err.message || 'Triage pipeline failed' });
  }
});

router.get('/triage/stream/:requestId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  pool.query(
    'SELECT id FROM intake_requests WHERE id::text=$1 OR reference_id=$1',
    [req.params.requestId]
  ).then(result => {
    if (!result.rows.length) {
      res.write(`data: ${JSON.stringify({ error: 'Intake not found' })}\n\n`);
      res.end();
      return;
    }

    const streamKey = String(result.rows[0].id);
    if (!activeStreams.has(streamKey)) activeStreams.set(streamKey, []);
    activeStreams.get(streamKey).push(res);

    res.write(`data: ${JSON.stringify({ event: 'connected', streamKey })}\n\n`);

    req.on('close', () => {
      const clients = activeStreams.get(streamKey) || [];
      const idx = clients.indexOf(res);
      if (idx !== -1) clients.splice(idx, 1);
      if (clients.length === 0) activeStreams.delete(streamKey);
    });
  }).catch(err => {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  });
});

router.get('/triage/:requestId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, reference_id, triage_result, triage_status, triage_routing_lane, triage_composite_score, triage_risk_tier, triage_started_at, triage_completed_at FROM intake_requests WHERE id::text=$1 OR reference_id=$1',
      [req.params.requestId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Intake not found' });
    const row = result.rows[0];
    let triageResult = null;
    if (row.triage_result) {
      try { triageResult = typeof row.triage_result === 'object' ? row.triage_result : JSON.parse(row.triage_result); } catch {}
    }
    res.json({
      intakeId: row.id,
      referenceId: row.reference_id,
      status: row.triage_status,
      routingLane: row.triage_routing_lane,
      compositeScore: row.triage_composite_score,
      riskTier: row.triage_risk_tier,
      startedAt: row.triage_started_at,
      completedAt: row.triage_completed_at,
      triage: triageResult,
    });
  } catch (err) {
    console.error('Get triage error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/triage/stage/:stageName', async (req, res) => {
  try {
    const { stageName } = req.params;
    if (!STAGES.includes(stageName)) {
      return res.status(400).json({ error: `Invalid stage. Valid stages: ${STAGES.join(', ')}` });
    }

    const { requestId, intake } = req.body;
    let intakeData = intake;

    if (requestId && !intakeData) {
      const result = await pool.query(
        'SELECT * FROM intake_requests WHERE id::text=$1 OR reference_id=$1',
        [requestId]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Intake not found' });
      intakeData = result.rows[0];
    }

    if (!intakeData) return res.status(400).json({ error: 'requestId or intake body required' });

    const stageResult = await runSingleStage(stageName, intakeData);
    res.json({ stage: stageName, result: stageResult });
  } catch (err) {
    console.error(`Stage ${req.params.stageName} error:`, err);
    res.status(500).json({ error: err.message || 'Stage execution failed' });
  }
});

module.exports = router;
