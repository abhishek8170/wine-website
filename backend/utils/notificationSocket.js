let notificationIO = null;

// ============================================
// SET SOCKET.IO INSTANCE
// ============================================

const setNotificationIO = (io) => {
  notificationIO = io;

  console.log("Notification Socket.IO initialized");
};

// ============================================
// GET SOCKET.IO INSTANCE
// ============================================

const getNotificationIO = () => {
  return notificationIO;
};

// ============================================
// ADMIN NOTIFICATION
// ============================================

const emitAdminNotificationCreated = (
  notificationId
) => {
  if (!notificationIO) {
    console.warn(
      "Socket.IO is not initialized. Admin notification not emitted."
    );

    return;
  }

  notificationIO.emit(
    "admin:notification-created",
    {
      notificationId,
    }
  );

  console.log(
    "Admin notification socket emitted:",
    notificationId
  );
};

// ============================================
// CUSTOMER NOTIFICATION
// ============================================

const emitCustomerNotificationCreated = ({
  customerId,
  notificationId,
}) => {
  if (!notificationIO) {
    console.warn(
      "Socket.IO is not initialized. Customer notification not emitted."
    );

    return;
  }

  notificationIO.emit(
    "customer:notification-created",
    {
      customerId,
      notificationId,
    }
  );

  console.log(
    "Customer notification socket emitted:",
    {
      customerId,
      notificationId,
    }
  );
};

// ============================================
// EXPORT
// ============================================

module.exports = {
  setNotificationIO,
  getNotificationIO,
  emitAdminNotificationCreated,
  emitCustomerNotificationCreated,
};