import React from 'react';
import { Search, Plus, ExternalLink, Shield, AlertTriangle, Github, Clock, CheckCircle2, ChevronRight, Menu } from 'lucide-react';

export function MidnightInk() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#A3A3A3] font-sans selection:bg-[#DC2626] selection:text-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-[#333333] bg-[#0D0D0D]">
        <div className="flex h-16 items-center px-6 gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <span className="text-[#0D0D0D] font-serif font-bold text-xl leading-none">M</span>
            </div>
            <span className="font-serif text-white text-xl font-bold tracking-tight uppercase">McCain EA</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <a href="#" className="text-white font-medium border-b-2 border-[#DC2626] py-5">Dashboard</a>
            <a href="#" className="text-[#A3A3A3] hover:text-white py-5 transition-colors">Architecture</a>
            <a href="#" className="text-[#A3A3A3] hover:text-white py-5 transition-colors">Security</a>
          </nav>
          
          <div className="ml-auto flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#525252]" />
              <input 
                type="text" 
                placeholder="Search architecture..." 
                className="w-64 bg-[#1a1a1a] border border-[#333333] text-white placeholder:text-[#525252] h-9 px-10 text-sm focus:outline-none focus:border-[#DC2626] transition-colors rounded-none"
              />
            </div>
            <div className="flex items-center gap-4 border-l border-[#333333] pl-6">
              <button className="text-[#A3A3A3] hover:text-white text-sm font-medium flex items-center gap-2 transition-colors">
                <ExternalLink className="w-4 h-4" />
                AI Portal
              </button>
              <button className="text-[#A3A3A3] hover:text-white text-sm font-medium flex items-center gap-2 transition-colors">
                <Github className="w-4 h-4" />
                GitHub
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] shrink-0 border-r border-[#333333] overflow-y-auto bg-[#0D0D0D]">
          <div className="py-6 px-5 space-y-8">
            <div>
              <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Pinned Views</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-white text-sm font-medium flex items-center justify-between group">My Dashboard <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#DC2626] transition-opacity" /></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm transition-colors">Review Queue</a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm transition-colors">Overdue Items</a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm transition-colors">Approved This Month</a></li>
              </ul>
            </div>
            
            <div className="h-px w-full bg-[#333333]" />
            
            <div>
              <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4">By Domain</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-white text-sm flex justify-between"><span>All Domains</span> <span className="text-[#525252] font-serif">13</span></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>App & Integration</span> <span className="text-[#525252] font-serif">10</span></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>Cloud & Platform</span> <span className="text-[#525252] font-serif">1</span></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>Containers</span> <span className="text-[#525252] font-serif">2</span></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>Data</span> <span className="text-[#525252] font-serif">1</span></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>Network</span> <span className="text-[#525252] font-serif">1</span></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>Security</span> <span className="text-[#525252] font-serif">2</span></a></li>
              </ul>
            </div>
            
            <div className="h-px w-full bg-[#333333]" />
            
            <div>
              <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4">By Status</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>Endorsed</span> <span className="text-[#525252] font-serif">2</span></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>Under Review</span> <span className="text-[#525252] font-serif">3</span></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>Submitted</span> <span className="text-[#525252] font-serif">3</span></a></li>
                <li><a href="#" className="text-[#A3A3A3] hover:text-white text-sm flex justify-between transition-colors"><span>Draft</span> <span className="text-[#525252] font-serif">2</span></a></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-16">
          <div className="p-8 max-w-7xl mx-auto space-y-8">
            
            {/* KPI Strip */}
            <div className="grid grid-cols-6 border-b border-[#333333] pb-8">
              <div className="border-r border-[#333333] px-6 first:pl-0 last:border-r-0">
                <p className="text-[#525252] text-xs font-bold uppercase tracking-widest mb-2">Total Requests</p>
                <p className="text-white font-serif text-4xl leading-none">13</p>
              </div>
              <div className="border-r border-[#333333] px-6 last:border-r-0">
                <p className="text-[#525252] text-xs font-bold uppercase tracking-widest mb-2">Endorsed</p>
                <p className="text-white font-serif text-4xl leading-none">9</p>
              </div>
              <div className="border-r border-[#333333] px-6 last:border-r-0">
                <p className="text-[#525252] text-xs font-bold uppercase tracking-widest mb-2">Under Review</p>
                <p className="text-white font-serif text-4xl leading-none">6</p>
              </div>
              <div className="border-r border-[#333333] px-6 last:border-r-0">
                <p className="text-[#DC2626] text-xs font-bold uppercase tracking-widest mb-2">Avg Risk Score</p>
                <p className="text-[#DC2626] font-serif text-4xl leading-none">60</p>
              </div>
              <div className="border-r border-[#333333] px-6 last:border-r-0">
                <p className="text-[#525252] text-xs font-bold uppercase tracking-widest mb-2">Vendors Active</p>
                <p className="text-white font-serif text-4xl leading-none">0</p>
              </div>
              <div className="px-6 last:border-r-0">
                <p className="text-[#525252] text-xs font-bold uppercase tracking-widest mb-2">Decisions Today</p>
                <p className="text-white font-serif text-4xl leading-none">0</p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
              {/* Left Column (8 cols) */}
              <div className="col-span-8 space-y-8">
                
                {/* Intake Review Queue */}
                <section>
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-white font-serif text-2xl">Intake Review Queue</h2>
                    <button className="bg-white text-[#0D0D0D] px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-[#A3A3A3] transition-colors rounded-none">
                      <Plus className="w-4 h-4" />
                      New Request
                    </button>
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#333333]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#333333]">
                          <th className="text-left py-4 px-4 text-[#525252] font-normal uppercase text-xs tracking-widest">Reference</th>
                          <th className="text-left py-4 px-4 text-[#525252] font-normal uppercase text-xs tracking-widest">Title</th>
                          <th className="text-left py-4 px-4 text-[#525252] font-normal uppercase text-xs tracking-widest">Risk</th>
                          <th className="text-left py-4 px-4 text-[#525252] font-normal uppercase text-xs tracking-widest">Status</th>
                          <th className="text-right py-4 px-4 text-[#525252] font-normal uppercase text-xs tracking-widest">Days</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#333333]">
                        <tr className="hover:bg-[#222222] transition-colors group cursor-pointer">
                          <td className="py-4 px-4 font-serif text-white">IR-001</td>
                          <td className="py-4 px-4 text-white">Cloud Migration Platform</td>
                          <td className="py-4 px-4"><span className="text-[#DC2626] border border-[#DC2626] px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">Critical</span></td>
                          <td className="py-4 px-4 text-[#A3A3A3]">Under Review</td>
                          <td className="py-4 px-4 text-right font-serif text-white">12</td>
                        </tr>
                        <tr className="hover:bg-[#222222] transition-colors group cursor-pointer">
                          <td className="py-4 px-4 font-serif text-white">EAR-002</td>
                          <td className="py-4 px-4 text-white">Customer Data Lake</td>
                          <td className="py-4 px-4"><span className="text-white border border-[#333333] px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">High</span></td>
                          <td className="py-4 px-4 text-[#A3A3A3]">Submitted</td>
                          <td className="py-4 px-4 text-right font-serif text-white">5</td>
                        </tr>
                        <tr className="hover:bg-[#222222] transition-colors group cursor-pointer">
                          <td className="py-4 px-4 font-serif text-white">IR-003</td>
                          <td className="py-4 px-4 text-white">SAP S/4HANA Upgrade</td>
                          <td className="py-4 px-4"><span className="text-white border border-[#333333] px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">Medium</span></td>
                          <td className="py-4 px-4 text-[#A3A3A3]">Draft</td>
                          <td className="py-4 px-4 text-right font-serif text-white">2</td>
                        </tr>
                        <tr className="hover:bg-[#222222] transition-colors group cursor-pointer">
                          <td className="py-4 px-4 font-serif text-white">EAR-004</td>
                          <td className="py-4 px-4 text-white">B2B Portal Redesign</td>
                          <td className="py-4 px-4"><span className="text-white border border-[#333333] px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">Low</span></td>
                          <td className="py-4 px-4 text-[#A3A3A3]">Endorsed</td>
                          <td className="py-4 px-4 text-right font-serif text-white">0</td>
                        </tr>
                        <tr className="hover:bg-[#222222] transition-colors group cursor-pointer">
                          <td className="py-4 px-4 font-serif text-white">IR-005</td>
                          <td className="py-4 px-4 text-white">Factory IoT Edge Hub</td>
                          <td className="py-4 px-4"><span className="text-[#DC2626] border border-[#DC2626] px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">Critical</span></td>
                          <td className="py-4 px-4 text-[#A3A3A3]">Under Review</td>
                          <td className="py-4 px-4 text-right font-serif text-white">8</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-8">
                  {/* Intake by Domain */}
                  <section>
                    <h2 className="text-white font-serif text-2xl mb-4 border-b border-[#333333] pb-4">Intake by Domain</h2>
                    <div className="space-y-5 pt-2">
                      {[
                        { label: 'Application & Integration', value: 10, max: 10 },
                        { label: 'Security', value: 2, max: 10 },
                        { label: 'Containers', value: 2, max: 10 },
                        { label: 'Cloud & Platform', value: 1, max: 10 },
                        { label: 'Data', value: 1, max: 10 },
                        { label: 'Network', value: 1, max: 10 },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                          <span className="text-sm w-36 truncate text-[#A3A3A3] group-hover:text-white transition-colors">{item.label}</span>
                          <div className="flex-1 h-[2px] bg-[#1a1a1a]">
                            <div 
                              className={`h-full ${item.value === item.max ? 'bg-[#DC2626]' : 'bg-[#525252]'}`} 
                              style={{ width: `${(item.value / item.max) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-serif text-white w-6 text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Solution Designs */}
                  <section>
                    <div className="flex justify-between items-baseline border-b border-[#333333] pb-4 mb-4">
                      <h2 className="text-white font-serif text-2xl">Solution Designs</h2>
                      <a href="#" className="text-xs text-[#525252] hover:text-white uppercase tracking-widest transition-colors">View All</a>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {[
                        { title: 'Global Identity Access', status: 'In Review', type: 'Security' },
                        { title: 'Data Lake Storage', status: 'Approved', type: 'Data' },
                        { title: 'Microservices Mesh', status: 'Approved', type: 'Integration' },
                        { title: 'Edge Compute Node', status: 'Draft', type: 'Cloud' },
                      ].map((item, i) => (
                        <div key={i} className="p-4 border border-[#333333] bg-[#1a1a1a] hover:border-[#525252] transition-colors cursor-pointer group flex flex-col justify-between h-32">
                          <div>
                            <span className="text-[#525252] text-[10px] uppercase tracking-widest">{item.type}</span>
                            <h4 className="text-white text-sm font-medium mt-1 leading-snug group-hover:text-[#DC2626] transition-colors">{item.title}</h4>
                          </div>
                          <span className="text-xs text-[#A3A3A3] border-t border-[#333333] pt-2 w-full flex items-center gap-2">
                            {item.status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-[#A3A3A3]" />}
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Right Column (4 cols) */}
              <div className="col-span-4 space-y-8 pl-8 border-l border-[#333333]">
                
                {/* Risk Distribution */}
                <section>
                  <h2 className="text-white font-serif text-2xl mb-4 border-b border-[#333333] pb-4">Risk Distribution</h2>
                  <div className="grid grid-cols-2 gap-4 pt-2 mb-4">
                    <div className="border border-[#DC2626] bg-[#1a1a1a] p-4 flex flex-col justify-between h-24">
                      <p className="text-[#DC2626] text-[10px] uppercase font-bold tracking-widest">Critical</p>
                      <p className="text-[#DC2626] font-serif text-3xl">1</p>
                    </div>
                    <div className="border border-[#333333] bg-[#1a1a1a] p-4 flex flex-col justify-between h-24">
                      <p className="text-[#525252] text-[10px] uppercase font-bold tracking-widest">High</p>
                      <p className="text-white font-serif text-3xl">3</p>
                    </div>
                    <div className="border border-[#333333] bg-[#1a1a1a] p-4 flex flex-col justify-between h-24">
                      <p className="text-[#525252] text-[10px] uppercase font-bold tracking-widest">Medium</p>
                      <p className="text-white font-serif text-3xl">5</p>
                    </div>
                    <div className="border border-[#333333] bg-[#1a1a1a] p-4 flex flex-col justify-between h-24">
                      <p className="text-[#525252] text-[10px] uppercase font-bold tracking-widest">Low</p>
                      <p className="text-white font-serif text-3xl">2</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#A3A3A3] leading-relaxed">
                    <strong className="text-white font-normal">1</strong> item requires immediate architectural intervention. <strong className="text-white font-normal">3</strong> items are flagged for high-level review before proceeding.
                  </p>
                </section>

                {/* Pattern Board */}
                <section>
                  <div className="flex justify-between items-baseline border-b border-[#333333] pb-4 mb-4">
                    <h2 className="text-white font-serif text-2xl">Pattern Board</h2>
                    <a href="#" className="text-xs text-[#525252] hover:text-white uppercase tracking-widest transition-colors">View All</a>
                  </div>
                  <div className="space-y-3 pt-2">
                    {[
                      { id: 'AP-001', name: 'API Gateway Standard' },
                      { id: 'AP-002', name: 'Event-Driven Microservices' },
                      { id: 'AP-003', name: 'Zero Trust Network Auth' },
                      { id: 'AP-004', name: 'Multi-Region Data Sync' },
                    ].map((pattern, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] transition-colors cursor-pointer group">
                        <span className="font-serif text-[#525252] text-sm group-hover:text-[#DC2626] transition-colors">{pattern.id}</span>
                        <span className="text-white text-sm">{pattern.name}</span>
                        <ChevronRight className="w-4 h-4 text-[#333333] ml-auto group-hover:text-[#DC2626]" />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recent Activity */}
                <section>
                  <h2 className="text-white font-serif text-2xl mb-4 border-b border-[#333333] pb-4">Recent Activity</h2>
                  <div className="space-y-6 pt-2">
                    {[
                      { time: '10:42 AM', action: 'Approved', target: 'Data Lake Storage', actor: 'J. Smith' },
                      { time: '09:15 AM', action: 'Submitted', target: 'Cloud Migration Platform', actor: 'A. Davis' },
                      { time: 'Yesterday', action: 'Flagged', target: 'Factory IoT Edge Hub', actor: 'Risk AI' },
                      { time: 'Yesterday', action: 'Drafted', target: 'B2B Portal Redesign', actor: 'M. Chen' },
                      { time: '2 Days Ago', action: 'Endorsed', target: 'API Gateway Standard', actor: 'EA Board' },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-16 shrink-0 pt-0.5">
                          <span className="text-[10px] text-[#525252] uppercase tracking-widest">{item.time}</span>
                        </div>
                        <div>
                          <p className="text-sm text-white leading-snug">
                            <span className={item.action === 'Flagged' ? 'text-[#DC2626]' : 'text-[#A3A3A3]'}>{item.action}</span> {item.target}
                          </p>
                          <p className="text-xs text-[#525252] mt-1 font-serif italic">by {item.actor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
