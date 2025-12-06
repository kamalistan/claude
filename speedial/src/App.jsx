import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play,
  User, Building2, MapPin, Mail, Clock,
  CheckCircle, XCircle, AlertCircle, Voicemail,
  Target, TrendingUp, Timer, PhoneMissed
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
                <button className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">
                  Dialer
                </button>
                <button className="text-gray-500 font-medium hover:text-gray-700">
                  Analytics
                </button>
                <button className="text-gray-500 font-medium hover:text-gray-700">
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
    </div>
  );
}

export default App;
