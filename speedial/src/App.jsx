import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play,
  User, Building2, MapPin, Mail, Clock,
  CheckCircle, XCircle, AlertCircle, Voicemail,
  Target, TrendingUp, Timer, PhoneMissed,
  BarChart3, PieChart, Calendar, Save,
  Settings as SettingsIcon, Bell, Volume2, Users
} from 'lucide-react';

// Initial contacts queue
const INITIAL_CONTACTS = [
  {
    id: 1,
    name: 'Parmarth Singh',
    phone: '+16095061692',
    company: 'Client',
    title: 'Decision Maker',
    location: 'New Jersey',
    email: 'parmarth@example.com',
    status: 'queued'
  },
  {
    id: 2,
    name: 'Kanwal Singh',
    phone: '+19293068886',
    company: 'Client',
    title: 'Manager',
    location: 'New York',
    email: 'kanwal@example.com',
    status: 'queued'
  },
  {
    id: 3,
    name: 'Kulwinder Singh',
    phone: '+13472644578',
    company: 'Client',
    title: 'VP Sales',
    location: 'New York',
    email: 'kulwinder@example.com',
    status: 'queued'
  },
  {
    id: 4,
    name: 'Jaswinder Kaur',
    phone: '+19293512145',
    company: 'Client',
    title: 'Director',
    location: 'New York',
    email: 'jaswinder@example.com',
    status: 'queued'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('dialer');
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [isDialing, setIsDialing] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [waitingCalls, setWaitingCalls] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalDials: 0,
    connects: 0,
    talkTime: 0,
    voicemails: 0,
    noAnswers: 0
  });

  // Settings
  const [settings, setSettings] = useState({
    dailyGoal: 50,
    simultaneousCalls: 3,
    dialingInterval: 5,
    amdEnabled: true,
    voicemailDropDelay: 1.5,
    soundNotifications: true,
    autoDisposition: false,
    callRecording: false
  });

  const dialingInterval = useRef(null);
  const callTimer = useRef(null);
  const audioRef = useRef(null);

  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate stats percentages
  const connectRate = stats.totalDials > 0
    ? ((stats.connects / stats.totalDials) * 100).toFixed(1)
    : 0;
  const noAnswerRate = stats.totalDials > 0
    ? ((stats.noAnswers / stats.totalDials) * 100).toFixed(1)
    : 0;
  const avgTalkTime = stats.connects > 0
    ? Math.floor(stats.talkTime / stats.connects)
    : 0;
  const dailyGoalProgress = (stats.totalDials / 50) * 100;

  // Start call timer
  useEffect(() => {
    if (activeCall && !isPaused) {
      callTimer.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimer.current) clearInterval(callTimer.current);
    }

    return () => {
      if (callTimer.current) clearInterval(callTimer.current);
    };
  }, [activeCall, isPaused]);

  // Play notification sound when prospect connects
  const playConnectSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  // Simulate dialing 3 contacts simultaneously
  const dialNextBatch = () => {
    const queuedContacts = contacts.filter(c => c.status === 'queued');
    const batchSize = Math.min(3, queuedContacts.length);

    if (batchSize === 0) {
      stopDialing();
      return;
    }

    const batch = queuedContacts.slice(0, batchSize);

    // Set contacts to dialing
    setContacts(prev => prev.map(contact => {
      if (batch.find(b => b.id === contact.id)) {
        return { ...contact, status: 'dialing' };
      }
      return contact;
    }));

    // Simulate AMD detection after 2-3 seconds
    batch.forEach(contact => {
      const amdDelay = 2000 + Math.random() * 1000;

      setTimeout(() => {
        const outcome = Math.random();

        if (outcome < 0.35) {
          // Voicemail - auto-drop immediately
          handleVoicemail(contact.id);
        } else if (outcome < 0.65) {
          // Human answer - connect
          handleConnect(contact.id);
        } else {
          // No answer
          handleNoAnswer(contact.id);
        }
      }, amdDelay);
    });
  };

  // Handle voicemail detection
  const handleVoicemail = (contactId) => {
    setContacts(prev => prev.map(c =>
      c.id === contactId ? { ...c, status: 'voicemail' } : c
    ));

    setStats(prev => ({
      ...prev,
      totalDials: prev.totalDials + 1,
      voicemails: prev.voicemails + 1
    }));

    // Auto-drop after 1.5 seconds
    setTimeout(() => {
      setContacts(prev => prev.filter(c => c.id !== contactId));
    }, 1500);
  };

  // Handle human connection
  const handleConnect = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);

    setContacts(prev => prev.map(c =>
      c.id === contactId ? { ...c, status: 'connected' } : c
    ));

    setStats(prev => ({
      ...prev,
      totalDials: prev.totalDials + 1,
      connects: prev.connects + 1
    }));

    playConnectSound();

    // If no active call, make this the active call
    if (!activeCall) {
      setActiveCall({ ...contact, status: 'connected', startTime: Date.now() });
      setCallDuration(0);
    } else {
      // Add to waiting calls
      setWaitingCalls(prev => [...prev, { ...contact, status: 'connected', startTime: Date.now() }]);
    }
  };

  // Handle no answer
  const handleNoAnswer = (contactId) => {
    setContacts(prev => prev.map(c =>
      c.id === contactId ? { ...c, status: 'no-answer' } : c
    ));

    setStats(prev => ({
      ...prev,
      totalDials: prev.totalDials + 1,
      noAnswers: prev.noAnswers + 1
    }));

    // Remove after showing status briefly
    setTimeout(() => {
      setContacts(prev => prev.filter(c => c.id !== contactId));
    }, 2000);
  };

  // Start dialing campaign
  const startDialing = () => {
    setIsDialing(true);
    dialNextBatch();

    // Dial next batch every 5 seconds
    dialingInterval.current = setInterval(() => {
      dialNextBatch();
    }, 5000);
  };

  // Stop dialing campaign
  const stopDialing = () => {
    setIsDialing(false);
    if (dialingInterval.current) {
      clearInterval(dialingInterval.current);
      dialingInterval.current = null;
    }
  };

  // Switch to waiting call
  const switchToCall = (waitingContact) => {
    if (activeCall) {
      // Put current call on hold
      setWaitingCalls(prev => [...prev, activeCall]);
    }

    // Set new active call
    setActiveCall(waitingContact);
    setCallDuration(Math.floor((Date.now() - waitingContact.startTime) / 1000));

    // Remove from waiting calls
    setWaitingCalls(prev => prev.filter(c => c.id !== waitingContact.id));
  };

  // Hang up active call
  const hangUp = (disposition = null) => {
    if (activeCall) {
      // Update stats with talk time
      setStats(prev => ({
        ...prev,
        talkTime: prev.talkTime + callDuration
      }));

      // Remove from contacts
      setContacts(prev => prev.filter(c => c.id !== activeCall.id));

      // Move to next waiting call if available
      if (waitingCalls.length > 0) {
        const nextCall = waitingCalls[0];
        setActiveCall(nextCall);
        setCallDuration(Math.floor((Date.now() - nextCall.startTime) / 1000));
        setWaitingCalls(prev => prev.slice(1));
      } else {
        setActiveCall(null);
        setCallDuration(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden audio element for notification */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+DyvmwhBjiP1/LNeSsFJHbH8N2RQAoUXrTq66hVFApFn+Dyv2wh" />

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Phone className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Speedial</h1>
              </div>
              <div className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('dialer')}
                  className={`font-medium pb-1 transition-colors ${
                    activeTab === 'dialer'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dialer
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`font-medium pb-1 transition-colors ${
                    activeTab === 'analytics'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`font-medium pb-1 transition-colors ${
                    activeTab === 'settings'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>+1 (833) 845-0617</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Dialer Tab Content */}
      {activeTab === 'dialer' && (
      <>
      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-5 gap-4 mb-6">
          {/* Total Dials */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Dials</span>
              <Target className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalDials}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(dailyGoalProgress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">Goal: 50/day</div>
          </div>

          {/* Connects */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Connects</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.connects}</div>
            <div className="text-sm text-green-600 font-medium mt-1">
              {connectRate}% connect rate
            </div>
          </div>

          {/* Talk Time */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Talk Time</span>
              <Timer className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{formatTime(stats.talkTime)}</div>
            <div className="text-sm text-gray-500 mt-1">
              Avg: {formatTime(avgTalkTime)}
            </div>
          </div>

          {/* Voicemails */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Voicemails</span>
              <Voicemail className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.voicemails}</div>
            <div className="text-sm text-yellow-600 font-medium mt-1">
              Auto-dropped
            </div>
          </div>

          {/* No Answers */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">No Answers</span>
              <PhoneMissed className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.noAnswers}</div>
            <div className="text-sm text-gray-500 mt-1">
              {noAnswerRate}% of dials
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Active Call Panel - 2 columns */}
          <div className="col-span-2">
            {activeCall ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Active Call</h2>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-xl font-mono">{formatTime(callDuration)}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Card */}
                <div className="p-6">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{activeCall.name}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <Building2 className="w-4 h-4 mr-2" />
                          <span>{activeCall.title} at {activeCall.company}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{activeCall.phone}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          <span>{activeCall.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{activeCall.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call Controls */}
                  <div className="flex items-center justify-center space-x-4 mb-6 py-4 border-y border-gray-200">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-4 rounded-full transition-colors ${
                        isMuted
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className={`p-4 rounded-full transition-colors ${
                        isPaused
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => hangUp()}
                      className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      <PhoneOff className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Disposition Buttons */}
                  <div className="grid grid-cols-4 gap-3">
                    <button
                      onClick={() => hangUp('interested')}
                      className="py-3 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                    >
                      Interested
                    </button>
                    <button
                      onClick={() => hangUp('callback')}
                      className="py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      Callback
                    </button>
                    <button
                      onClick={() => hangUp('not-interested')}
                      className="py-3 px-4 rounded-lg bg-gray-400 text-white font-medium hover:bg-gray-500 transition-colors"
                    >
                      Not Interested
                    </button>
                    <button
                      onClick={() => hangUp('dnc')}
                      className="py-3 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                    >
                      Do Not Call
                    </button>
                  </div>
                </div>

                {/* Waiting Calls Alert */}
                {waitingCalls.length > 0 && (
                  <div className="mx-6 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-900">
                            {waitingCalls.length} More Connected Call{waitingCalls.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {waitingCalls.map(call => (
                          <button
                            key={call.id}
                            onClick={() => switchToCall(call)}
                            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-gray-900">{call.name}</div>
                                <div className="text-sm text-gray-600">{call.title}</div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-blue-600">
                              Switch →
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Call</h3>
                <p className="text-gray-600">
                  {isDialing
                    ? 'Dialing contacts... waiting for connection'
                    : 'Click "Start Dialing" to begin your campaign'}
                </p>
              </div>
            )}
          </div>

          {/* Call Queue Panel - 1 column */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Queue Header */}
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Call Queue</h3>
                  <span className="text-sm text-gray-600">
                    {contacts.filter(c => c.status === 'queued').length} contacts
                  </span>
                </div>
              </div>

              {/* Queue List */}
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {contacts.map(contact => (
                  <div key={contact.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      {/* Status Indicator */}
                      <div className="mt-1">
                        {contact.status === 'queued' && (
                          <div className="w-3 h-3 rounded-full bg-gray-300" />
                        )}
                        {contact.status === 'dialing' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500 pulse-ring" />
                        )}
                        {contact.status === 'connected' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {contact.status === 'voicemail' && (
                          <Voicemail className="w-5 h-5 text-yellow-500" />
                        )}
                        {contact.status === 'no-answer' && (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {contact.name}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {contact.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {contact.phone}
                        </div>

                        {/* Status Badge */}
                        {contact.status !== 'queued' && (
                          <div className="mt-2">
                            {contact.status === 'dialing' && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                Dialing...
                              </span>
                            )}
                            {contact.status === 'connected' && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                Connected
                              </span>
                            )}
                            {contact.status === 'voicemail' && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                Voicemail - Auto-dropping
                              </span>
                            )}
                            {contact.status === 'no-answer' && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                No Answer
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {contacts.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>Queue is empty</p>
                    <p className="text-sm mt-1">All contacts have been processed</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="p-4 border-t border-gray-200">
                {!isDialing ? (
                  <button
                    onClick={startDialing}
                    disabled={contacts.filter(c => c.status === 'queued').length === 0}
                    className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Start Dialing</span>
                  </button>
                ) : (
                  <button
                    onClick={stopDialing}
                    className="w-full py-3 px-4 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <PhoneOff className="w-5 h-5" />
                    <span>Stop Campaign</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>

          {/* Performance Overview */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Call Performance</h3>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Connect Rate</span>
                    <span className="font-semibold text-gray-900">{connectRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${connectRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Voicemail Rate</span>
                    <span className="font-semibold text-gray-900">
                      {stats.totalDials > 0 ? ((stats.voicemails / stats.totalDials) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${stats.totalDials > 0 ? (stats.voicemails / stats.totalDials) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">No Answer Rate</span>
                    <span className="font-semibold text-gray-900">{noAnswerRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${noAnswerRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Talk Time Analysis</h3>
                <Timer className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Talk Time</span>
                  <span className="font-semibold text-gray-900">{formatTime(stats.talkTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average per Call</span>
                  <span className="font-semibold text-gray-900">{formatTime(avgTalkTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Longest Call</span>
                  <span className="font-semibold text-gray-900">
                    {stats.connects > 0 ? formatTime(Math.floor(stats.talkTime / Math.max(1, stats.connects) * 1.5)) : '0:00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Connects</span>
                  <span className="font-semibold text-gray-900">{stats.connects}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Daily Progress</h3>
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {Math.min(100, dailyGoalProgress.toFixed(0))}%
                </div>
                <div className="text-sm text-gray-600">of daily goal</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-semibold text-gray-900">{stats.totalDials}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-semibold text-gray-900">{Math.max(0, settings.dailyGoal - stats.totalDials)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Call Distribution Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Call Distribution</h3>
              <PieChart className="w-5 h-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.connects}</div>
                <div className="text-sm font-medium text-gray-600">Connected</div>
                <div className="text-xs text-gray-500 mt-1">{connectRate}%</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.voicemails}</div>
                <div className="text-sm font-medium text-gray-600">Voicemails</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.totalDials > 0 ? ((stats.voicemails / stats.totalDials) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-600 mb-2">{stats.noAnswers}</div>
                <div className="text-sm font-medium text-gray-600">No Answer</div>
                <div className="text-xs text-gray-500 mt-1">{noAnswerRate}%</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalDials}</div>
                <div className="text-sm font-medium text-gray-600">Total Dials</div>
                <div className="text-xs text-gray-500 mt-1">100%</div>
              </div>
            </div>
          </div>

          {/* Historical Data Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Session Summary</h3>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Session</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">Total Dials</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{stats.totalDials}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{settings.dailyGoal}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        stats.totalDials >= settings.dailyGoal ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {stats.totalDials >= settings.dailyGoal ? 'Goal Met' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">Connect Rate</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{connectRate}%</td>
                    <td className="px-4 py-4 text-sm text-gray-600">30%</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseFloat(connectRate) >= 30 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {parseFloat(connectRate) >= 30 ? 'Above Target' : 'Below Target'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">Avg Talk Time</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{formatTime(avgTalkTime)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">2:00</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        avgTalkTime >= 120 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {avgTalkTime >= 120 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab Content */}
      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

          {/* Dialer Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <Phone className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dialer Configuration</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Goal (calls per day)
                </label>
                <input
                  type="number"
                  value={settings.dailyGoal}
                  onChange={(e) => setSettings({ ...settings, dailyGoal: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="500"
                />
                <p className="text-sm text-gray-500 mt-1">Set your daily calling target</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Simultaneous Calls
                </label>
                <input
                  type="number"
                  value={settings.simultaneousCalls}
                  onChange={(e) => setSettings({ ...settings, simultaneousCalls: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="5"
                />
                <p className="text-sm text-gray-500 mt-1">Number of calls to dial at once (1-5)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dialing Interval (seconds)
                </label>
                <input
                  type="number"
                  value={settings.dialingInterval}
                  onChange={(e) => setSettings({ ...settings, dialingInterval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="3"
                  max="30"
                />
                <p className="text-sm text-gray-500 mt-1">Time between dialing batches</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voicemail Drop Delay (seconds)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.voicemailDropDelay}
                  onChange={(e) => setSettings({ ...settings, voicemailDropDelay: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0.5"
                  max="5"
                />
                <p className="text-sm text-gray-500 mt-1">How long to wait before auto-dropping voicemail</p>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Features</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">AMD (Answering Machine Detection)</div>
                    <div className="text-sm text-gray-500">Automatically detect and drop voicemails</div>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, amdEnabled: !settings.amdEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.amdEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.amdEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Sound Notifications</div>
                    <div className="text-sm text-gray-500">Play sound when prospect connects</div>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, soundNotifications: !settings.soundNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.soundNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Auto Disposition</div>
                    <div className="text-sm text-gray-500">Automatically disposition calls after hangup</div>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoDisposition: !settings.autoDisposition })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoDisposition ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoDisposition ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Mic className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Call Recording</div>
                    <div className="text-sm text-gray-500">Record all calls for quality assurance</div>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, callRecording: !settings.callRecording })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.callRecording ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.callRecording ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Account</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caller ID Number
                </label>
                <input
                  type="tel"
                  value="+1 (833) 845-0617"
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-sm text-gray-500 mt-1">Your outbound caller ID</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twilio Integration
                </label>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Not Connected</div>
                      <div className="text-sm text-gray-500">Configure Twilio credentials for live calling</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
