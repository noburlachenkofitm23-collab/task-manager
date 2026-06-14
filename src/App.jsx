import { useState, useEffect } from 'react';
import { Trash2, Plus, Check, Square, ArrowLeft, Search, X, ChevronLeft, ChevronRight, CalendarClock, Sun, Moon } from 'lucide-react';
import { taskService } from './TaskService';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme !== null ? savedTheme === 'dark' : true;
  });

  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);

  const [input, setInput] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeStr, setTimeStr] = useState('12:00');

  useEffect(() => {
    localStorage.setItem('appTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await taskService.getTasks();
        const sortedData = data.sort((a, b) => b.timestamp - a.timestamp);
        setTasks(sortedData);
      } catch (error) {
        console.error("Database connection error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  const getDynamicPriority = (deadlineDateStr) => {
    if (!deadlineDateStr) return 'low';
    const taskDate = new Date(deadlineDateStr);
    const now = new Date();
    const daysDiff = (taskDate - now) / (1000 * 3600 * 24);

    if (daysDiff <= 1) return 'high';
    if (daysDiff <= 3) return 'medium';
    return 'low';
  };

  const addTask = async () => {
    if (!input.trim()) return;

    const pad = (n) => String(n).padStart(2, '0');
    const deadlineString = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}T${timeStr}`;

    const now = new Date();
    const formattedCreatedAt = `${pad(now.getDate())}/${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newTaskData = {
      text: input,
      completed: false,
      deadline: deadlineString,
      createdAt: formattedCreatedAt,
      timestamp: Date.now()
    };

    const savedTask = await taskService.addTask(newTaskData);
    setTasks([savedTask, ...tasks]);

    setInput('');
    setActiveView('list');
  };

  const toggleTask = async (id, currentStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    await taskService.toggleTask(id, currentStatus);
  };

  const deleteTask = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    await taskService.deleteTask(id);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filter === 'all' || (filter === 'active' && !task.completed) || (filter === 'completed' && task.completed);
    const matchesSearch = task.text.toLowerCase().includes(search.toLowerCase());

    const taskPriority = getDynamicPriority(task.deadline);
    const matchesPriority = priorityFilter === 'all' || taskPriority === priorityFilter;

    return matchesStatus && matchesSearch && matchesPriority;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const theme = {
    app: isDarkMode ? 'bg-[#1F2528]' : 'bg-[#FFFFFF]',
    card: isDarkMode ? 'bg-[#293135]' : 'bg-[#F1F5F9]',
    inner: isDarkMode ? 'bg-[#1F2528]' : 'bg-[#FFFFFF]',
    border: isDarkMode ? 'border-[#3A4449]' : 'border-[#E2E8F0]',
    textMain: isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]',
    textSec: isDarkMode ? 'text-[#E2E8F0]' : 'text-[#334155]',
    textMuted: isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]',
    textGhost: isDarkMode ? 'text-[#475569]' : 'text-[#94A3B8]',
    completedCard: isDarkMode ? 'bg-[#1F2528] border-[#1F2528]' : 'bg-[#FFFFFF] border-[#FFFFFF]',
  };

  const priorityStyles = {
    high: 'border-[#CC7878] text-[#CC7878] bg-[#CC7878]/10',
    medium: 'border-[#D4A373] text-[#D4A373] bg-[#D4A373]/10',
    low: 'border-[#81A684] text-[#81A684] bg-[#81A684]/10'
  };

  const formatDeadline = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const blanks = Array(firstDayOfMonth).fill(null);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className={`min-h-screen ${theme.app} ${theme.textSec} font-sans flex items-start justify-center p-4 sm:p-8 selection:bg-[#9976BF]/30 transition-colors duration-500`}>
      <div className={`w-full max-w-2xl ${theme.card} p-6 sm:p-8 rounded-3xl shadow-2xl border ${theme.border} transition-colors duration-500`}>

        {loading ? (
          <p className="text-center text-[#9976BF] font-medium mt-8 animate-pulse">Connecting to Server...</p>
        ) : (
          <>
            {activeView === 'add' && (
              <div className="space-y-8">
                <div className={`flex items-center gap-4 border-b ${theme.border} pb-6 transition-colors duration-500`}>
                  <button
                    onClick={() => setActiveView('list')}
                    className={`p-2.5 rounded-xl hover:${theme.inner} transition-colors ${theme.textMuted} hover:${theme.textMain}`}
                  >
                    <ArrowLeft size={22} />
                  </button>
                  <h1 className={`text-3xl font-bold tracking-tight ${theme.textMain} transition-colors duration-500`}>
                    New Task
                  </h1>

                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`ml-auto p-2 rounded-xl transition-all duration-500 ${theme.inner} ${theme.border} border hover:text-[#9976BF] ${theme.textMuted} relative w-10 h-10 flex items-center justify-center overflow-hidden`}
                  >
                    <Sun size={20} className={`absolute transition-all duration-500 ${isDarkMode ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
                    <Moon size={20} className={`absolute transition-all duration-500 ${isDarkMode ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
                  </button>
                </div>

                <div className={`space-y-6 ${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg transition-colors duration-500`}>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${theme.textMuted} transition-colors duration-500`}>Task Description</label>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className={`w-full ${theme.app} border ${theme.border} rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#9976BF]/40 focus:border-[#9976BF] transition-all placeholder-[#475569] ${theme.textMain}`}
                      placeholder="What needs to be done?"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className={`text-sm font-medium ${theme.textMuted} flex items-center gap-2 transition-colors duration-500`}>
                      <CalendarClock size={16} /> Deadline
                    </label>

                    <div className={`${theme.app} border ${theme.border} rounded-2xl p-5 select-none transition-colors duration-500`}>
                      <div className={`flex justify-between items-center mb-4 ${theme.textMain} transition-colors duration-500`}>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className={`p-1.5 hover:${theme.card} rounded-lg transition-colors`}>
                          <ChevronLeft size={20} />
                        </button>
                        <span className="font-semibold text-sm tracking-wide">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className={`p-1.5 hover:${theme.card} rounded-lg transition-colors`}>
                          <ChevronRight size={20} />
                        </button>
                      </div>

                      <div className={`grid grid-cols-7 gap-1 text-center mb-2 text-xs font-medium ${theme.textMuted} transition-colors duration-500`}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                        {monthDays.map(day => {
                          const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
                          return (
                            <button
                              key={day}
                              onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                              className={`p-2 rounded-xl transition-all ${isSelected
                                ? 'bg-[#9976BF] text-white shadow-sm font-bold'
                                : `hover:${theme.card} ${theme.textSec}`
                                }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      <div className={`mt-5 pt-5 border-t ${theme.border} flex items-center justify-between transition-colors duration-500`}>
                        <span className={`text-sm font-medium ${theme.textMuted} transition-colors duration-500`}>Time</span>
                        <input
                          type="time"
                          value={timeStr}
                          onChange={(e) => setTimeStr(e.target.value)}
                          className={`${theme.app} border ${theme.border} ${theme.textSec} rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#9976BF] transition-colors duration-500`}
                          style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`pt-8 border-t ${theme.border} flex gap-3 transition-colors duration-500`}>
                  <button
                    onClick={() => setActiveView('list')}
                    className={`flex-1 ${theme.card} hover:${theme.inner} ${theme.textSec} py-3.5 rounded-2xl font-medium transition-colors border ${theme.border}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTask}
                    disabled={!input.trim()}
                    className="flex-1 bg-[#9976BF] hover:bg-[#8262A5] disabled:bg-[#9976BF]/30 disabled:text-white/40 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-semibold transition-all shadow-sm"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            )}

            {activeView === 'list' && (
              <>
                <div className={`flex items-center gap-4 mb-8 border-b ${theme.border} pb-6 transition-colors duration-500`}>
                  <h1 className={`text-3xl font-bold tracking-tight ${theme.textMain} transition-colors duration-500`}>
                    Task Manager
                  </h1>

                  {searchVisible ? (
                    <div className={`flex-1 flex items-center gap-2 ${theme.app} border ${theme.border} rounded-full px-3 py-1.5 transition-all focus-within:ring-1 focus-within:ring-[#9976BF]`}>
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`flex-1 bg-transparent text-sm focus:outline-none placeholder-[#475569] ${theme.textSec}`}
                        placeholder="Search tasks..."
                        autoFocus
                      />
                      <button
                        onClick={() => { setSearchVisible(false); setSearch(''); }}
                        className={`p-1 rounded-full ${theme.textMuted} hover:text-[#CC7878]`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSearchVisible(true)}
                      className={`p-2 rounded-lg hover:${theme.inner} transition-colors ${theme.textMuted} hover:${theme.textMain} ml-auto mr-1`}
                    >
                      <Search size={22} />
                    </button>
                  )}

                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`${searchVisible ? 'hidden' : 'flex'} p-2 rounded-xl transition-all duration-500 ${theme.inner} ${theme.border} border hover:text-[#9976BF] ${theme.textMuted} relative w-10 h-10 items-center justify-center overflow-hidden mr-1`}
                  >
                    <Sun size={20} className={`absolute transition-all duration-500 ${isDarkMode ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
                    <Moon size={20} className={`absolute transition-all duration-500 ${isDarkMode ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
                  </button>

                  <button
                    onClick={() => setActiveView('add')}
                    className="bg-[#9976BF] hover:bg-[#8262A5] text-white p-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                </div>

                {totalTasks > 0 && (
                  <div className={`mb-8 p-5 ${theme.card} rounded-2xl border ${theme.border} transition-colors duration-500`}>
                    <div className={`flex justify-between mb-2 text-xs font-medium tracking-wide ${theme.textMuted} transition-colors duration-500`}>
                      <span>Progress</span>
                      <span className="text-[#9976BF]">{progressPercentage}%</span>
                    </div>
                    <div className={`w-full ${theme.app} h-2 rounded-full overflow-hidden border ${theme.border} transition-colors duration-500`}>
                      <div
                        className="bg-[#9976BF] h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {totalTasks > 0 && (
                  <div className={`flex gap-1 mb-8 justify-center ${theme.card} p-1.5 rounded-2xl w-fit mx-auto border ${theme.border} transition-colors duration-500 relative`}>

                    <div className="flex gap-1 transition-colors duration-500">
                      {['all', 'active', 'completed'].map(f => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${filter === f
                            ? `${theme.inner} ${theme.textMain} shadow-sm`
                            : `${theme.textMuted} hover:${theme.textMain}`
                            }`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setIsPriorityMenuOpen(!isPriorityMenuOpen)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${priorityFilter !== 'all' || isPriorityMenuOpen
                          ? `${theme.inner} ${theme.textMain} shadow-sm`
                          : `${theme.textMuted} hover:${theme.textMain}`
                          }`}
                      >
                        {priorityFilter === 'all' ? 'Priority' : priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                      </button>

                      {isPriorityMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsPriorityMenuOpen(false)}></div>

                          <div className={`absolute top-full right-0 mt-2 w-36 p-1.5 rounded-xl border shadow-lg z-20 ${theme.card} ${theme.border} transition-colors duration-500`}>
                            {['all', 'high', 'medium', 'low'].map(p => (
                              <button
                                key={p}
                                onClick={() => { setPriorityFilter(p); setIsPriorityMenuOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${priorityFilter === p
                                  ? `${theme.inner} text-[#9976BF] font-bold`
                                  : `${theme.textMuted} hover:${theme.inner}`
                                  }`}
                              >
                                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                )}

                <ul className="space-y-3.5">
                  {filteredTasks.map(task => {
                    const calculatedPriority = getDynamicPriority(task.deadline);

                    return (
                      <li
                        key={task.id}
                        className={`group flex flex-col p-5 rounded-2xl transition-all duration-500 border ${task.completed
                          ? theme.completedCard
                          : `${theme.card} ${theme.border} hover:border-[#9976BF]/50 hover:shadow-lg hover:shadow-black/10`
                          }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className="flex items-start gap-4 cursor-pointer flex-1 mt-0.5"
                            onClick={() => toggleTask(task.id, task.completed)}
                          >
                            {task.completed ? (
                              <Check className={`${theme.textGhost} min-w-[22px] transition-colors duration-500`} size={22} strokeWidth={2.5} />
                            ) : (
                              <Square className={`text-[#64748B] group-hover:text-[#9976BF] transition-colors min-w-[22px] duration-500`} size={22} strokeWidth={2} />
                            )}
                            <span className={`text-[16px] leading-relaxed break-words font-medium transition-colors duration-500 ${task.completed ? `line-through ${theme.textGhost}` : theme.textMain}`}>
                              {task.text}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className={`text-[#64748B] hover:text-[#CC7878] p-1.5 rounded-lg transition-all`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 mt-4 ml-9 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium transition-colors duration-500 ${task.completed ? theme.textGhost : theme.textMuted}`}>Priority:</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider border uppercase transition-colors duration-500 ${task.completed ? `border-transparent ${theme.textGhost} bg-transparent` : priorityStyles[calculatedPriority]}`}>
                              {calculatedPriority}
                            </span>
                          </div>

                          <div className={`flex items-center gap-2 border rounded-lg p-1.5 px-3 shadow-inner transition-colors duration-500 ${task.completed ? `${theme.completedCard}` : `${theme.border} ${theme.app}`}`}>
                            <CalendarClock size={14} className={`transition-colors duration-500 ${task.completed ? theme.textGhost : "text-[#9976BF]"}`} />
                            <span className={`text-xs font-medium transition-colors duration-500 ${task.completed ? theme.textGhost : theme.textMuted}`}>Deadline:</span>
                            <span className={`text-sm font-semibold transition-colors duration-500 ${task.completed ? theme.textGhost : theme.textMain}`}>
                              {task.deadline ? formatDeadline(task.deadline) : 'No deadline'}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <div className={`text-center py-16 border-2 border-dashed ${theme.border} rounded-2xl ${theme.card} transition-colors duration-500`}>
                      <p className={`${theme.textMuted} font-medium`}>No tasks found</p>
                    </div>
                  )}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}