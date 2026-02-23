// Admin collection exports
export {
  createAdmin,
  getAdmin,
  getAdminByEmail,
  getAllAdmins,
  updateAdmin,
  addAttendanceRecord,
  deleteAdmin,
} from './admin';

// Customer collection exports
export {
  createCustomer,
  getCustomer,
  getCustomerByEmail,
  getCustomerByMobile,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
} from './customer';

// Service collection exports
export {
  createService,
  getService,
  getAllServices,
  getActiveServices,
  updateService,
  deleteService,
} from './service';

// Sale collection exports
export {
  createSale,
  approveSale,
  declineSale,
  getSale,
  getAllSales,
  getSalesByCustomer,
  getSalesByStaff,
  updateSale,
  deleteSale,
  subscribeToSales
} from './sale';

// Notification collection exports
export {
  createNotification,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
} from './notification';
