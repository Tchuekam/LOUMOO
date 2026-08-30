/**
 * LOUMOO CHAT DATASET & CONVERSATION THREADS
 */
export const chatThreads = [
  {
    id: 'thread-seller-1',
    contactName: 'Mr Toukam',
    avatar: 'T',
    lastMessage: 'voici free',
    timestamp: '11:46',
    unreadCount: 2,
    onlineStatus: 'en ligne',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'yo',
        time: '17:12',
        status: 'read'
      },
      {
        id: 'msg-2',
        sender: 'user',
        type: 'contact',
        contactName: 'Beckysmile',
        time: '17:12',
        status: 'read'
      },
      {
        id: 'msg-3',
        sender: 'contact',
        type: 'audio',
        duration: '0:05',
        totalDuration: '11:44',
        time: '11:44',
        waveform: [12, 18, 22, 14, 8, 16, 20, 24, 18, 10, 14, 19, 11, 7, 15, 21, 17, 12, 9, 14, 18, 10]
      },
      {
        id: 'msg-4',
        sender: 'user',
        text: 'tchuekam.com/magida',
        isLink: true,
        time: '11:46',
        status: 'read'
      },
      {
        id: 'msg-5',
        sender: 'user',
        text: 'voici free',
        time: '11:46',
        status: 'read'
      }
    ]
  },
  {
    id: 'thread-ai',
    contactName: 'TchueKAM AI Assistant',
    avatar: 'AI',
    lastMessage: 'Three options match your budget in Douala…',
    timestamp: '11:41',
    unreadCount: 0,
    onlineStatus: 'en ligne'
  },
  {
    id: 'thread-orca',
    contactName: 'Orca Electronics ✓',
    avatar: 'O',
    lastMessage: 'Yes, it is in stock. We can deliver today.',
    timestamp: 'Hier',
    unreadCount: 0
  },
  {
    id: 'thread-marina',
    contactName: 'Marina K.',
    avatar: 'M',
    lastMessage: 'Is the Canon still available? I can pass by…',
    timestamp: '07/07',
    unreadCount: 0
  }
];
