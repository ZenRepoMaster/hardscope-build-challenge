import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Activity, Filter } from 'lucide-react';

const COLORS = [
  '#E6194B', // Red
  '#3CB44B', // Green
  '#FFE119', // Yellow
  '#4363D8', // Blue
  '#F58231', // Orange
  '#911EB4', // Purple
  '#42D4F4', // Cyan
  '#F032E6', // Magenta
  '#BFEF45', // Lime
  '#469990', // Teal
  '#9A6324', // Brown
  '#800000', // Maroon
  '#000075', // Navy
  '#808000'  // Olive
];

// SVG arrow for cross-browser dropdowns
const DROPDOWN_ICON = `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')`;

export default function App() {
  const [creators, setCreators] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [trendGenres, setTrendGenres] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);
  
  const [platformFilter, setPlatformFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'views', direction: 'desc' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [platformFilter, genreFilter]);

  const fetchInitialData = async () => {
    try {
      const [trendRes, genreRes] = await Promise.all([
        axios.get('http://localhost:3001/api/trends'),
        axios.get('http://localhost:3001/api/genres')
      ]);
      setTrendsData(trendRes.data.data);
      setTrendGenres(trendRes.data.genres);
      setAvailableGenres(genreRes.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchCreators = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/creators?platform=${platformFilter}&genre=${encodeURIComponent(genreFilter)}`);
      
      const incomingData = res.data;
      const { key, direction } = sortConfig;
      const sorted = [...incomingData].sort((a, b) => {
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
      });
      
      setCreators(sorted);
    } catch (error) {
      console.error("Error fetching creators:", error);
    }
  };

  const handleDropdownSort = (e) => {
    const [key, direction] = e.target.value.split('-');
    setSortConfig({ key, direction });
    
    const sorted = [...creators].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setCreators(sorted);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">HardScope Analytics</h1>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            value={platformFilter} 
            onChange={(e) => setPlatformFilter(e.target.value)} 
            className="appearance-none bg-transparent font-medium text-slate-700 outline-none cursor-pointer pl-1 pr-6 py-1 bg-no-repeat bg-[position:right_0_center] bg-[length:1em_1em]"
            style={{ backgroundImage: DROPDOWN_ICON }}
          >
            <option value="All">All Platforms</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
          </select>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-4 bg-blue-50 rounded-lg text-blue-600"><Users className="w-7 h-7" /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Creators Tracked</p>
              <p className="text-3xl font-bold text-slate-800">{creators.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-4 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp className="w-7 h-7" /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Avg Views</p>
              <p className="text-3xl font-bold text-slate-800">
                {creators.length ? (creators.reduce((a, c) => a + c.views, 0) / creators.length / 1000000).toFixed(2) : 0}M
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-4 bg-purple-50 rounded-lg text-purple-600"><Activity className="w-7 h-7" /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Avg Engagement</p>
              <p className="text-3xl font-bold text-slate-800">
                {creators.length ? ((creators.reduce((a, c) => a + c.engagement_rate, 0) / creators.length) * 100).toFixed(2) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Trends by Genre (2025)</h2>
            <div className="flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    wrapperStyle={{ zIndex: 100 }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${(value / 1000000).toFixed(1)}M Views`]} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    height={80}
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px", paddingLeft: "20px" }} 
                  />
                  {trendGenres.map((genre, idx) => (
                    <Line 
                      key={genre} 
                      type="monotone" 
                      dataKey={genre} 
                      stroke={COLORS[idx % COLORS.length]} 
                      strokeWidth={2} 
                      dot={false} 
                      activeDot={{ r: 6 }} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[550px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Top Performing Creators</h2>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Sort by:</span>
                <select 
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onChange={handleDropdownSort}
                  className="appearance-none bg-white border border-slate-300 text-slate-700 rounded-md pl-3 pr-8 py-1.5 outline-none cursor-pointer text-sm focus:ring-2 focus:ring-indigo-500 bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1em_1em]"
                  style={{ backgroundImage: DROPDOWN_ICON }}
                >
                  <option value="views-desc">Total Views (High to Low)</option>
                  <option value="views-asc">Total Views (Low to High)</option>
                  <option value="engagement_rate-desc">Eng. Rate (High to Low)</option>
                  <option value="engagement_rate-asc">Eng. Rate (Low to High)</option>
                  <option value="handle-asc">Creator (A to Z)</option>
                  <option value="handle-desc">Creator (Z to A)</option>
                  <option value="platform-asc">Platform (A to Z)</option>
                  <option value="platform-desc">Platform (Z to A)</option>
                </select>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-0">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Creator</th>
                    
                    <th className="px-6 py-4 font-semibold">
                      <div className="flex flex-col gap-1">
                        <span>Campaign Genre</span>
                        <select 
                          value={genreFilter}
                          onChange={(e) => setGenreFilter(e.target.value)}
                          className="appearance-none mt-1 bg-white border border-slate-300 text-slate-700 rounded pl-2 pr-7 py-1 outline-none cursor-pointer w-max focus:ring-2 focus:ring-indigo-500 font-normal normal-case bg-no-repeat bg-[position:right_0.3rem_center] bg-[length:1em_1em]"
                          style={{ backgroundImage: DROPDOWN_ICON }}
                        >
                          <option value="All">All Genres</option>
                          {availableGenres.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </th>

                    <th className="px-6 py-4 font-semibold">Context</th>
                    <th className="px-6 py-4 font-semibold">Platform</th>
                    <th className="px-6 py-4 font-semibold">Total Views</th>
                    <th className="px-6 py-4 font-semibold">Eng. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {creators.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">{c.handle}</td>
                      <td className="px-6 py-4 font-medium text-indigo-600">{c.genre || 'General'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 mb-0.5">{c.hashtag || '#Viral'}</span>
                          <span className="text-xs text-slate-500">{c.title_keywords || 'Content'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.platform === 'TikTok' ? 'bg-slate-800 text-white' : 'bg-red-100 text-red-800'}`}>
                          {c.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{c.views.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[40px] hidden lg:block">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(c.engagement_rate * 1000, 100)}%` }}></div>
                          </div>
                          <span className="text-slate-600 font-medium">{(c.engagement_rate * 100).toFixed(2)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}