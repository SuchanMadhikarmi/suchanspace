export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/vite.svg', // Default icon
      ...options,
    });
  }
};

export const checkAndSendReminders = () => {
  // A placeholder to be called by a setInterval or a Background Worker.
  // In a real application, you would query Dexie for upcoming tasks or habits 
  // that have reminders enabled and haven't fired yet.
  
  // Example dummy logic:
  // const tasks = await db.tasks.toArray();
  // const now = new Date();
  // ... check specific times ...
  // sendNotification("Time to focus!", { body: "You have upcoming tasks." });
};
