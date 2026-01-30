/**
 * Firebase Firestore Schema Definitions
 * These represent the document structures for each collection
 */

/**
 * Admin Collection
 * @typedef {Object} Attendance
 * @property {Date} date - Attendance date
 * @property {Date} [checkIn] - Check-in time
 * @property {Date} [checkOut] - Check-out time
 * @property {string} status - present, absent, or leave
 * @property {string} [note] - Additional notes
 *
 * @typedef {Object} Admin
 * @property {string} id - Document ID (auto-generated)
 * @property {string} name - Admin name
 * @property {string} email - Admin email (unique)
 * @property {string} role - admin or staff
 * @property {Attendance[]} attendance - Array of attendance records
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @note Password is managed by Firebase Authentication, not stored in Firestore
 */

/**
 * Customer Collection
 * @typedef {Object} Customer
 * @property {string} id - Document ID
 * @property {string} name - Customer name
 * @property {string} mobile - Mobile number
 * @property {string} email - Email address
 * @property {string} country - Country
 * @property {string} [place] - Place/Area
 * @property {string} [state] - State
 * @property {string} [city] - City
 * @property {string} [pincode] - Postal code
 * @property {string} [address] - Full address
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Service Collection
 * @typedef {Object} Service
 * @property {string} id - Document ID
 * @property {string} name - Service name
 * @property {string} [description] - Service description
 * @property {boolean} isActive - Active status
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Sale Collection
 * @typedef {Object} SaleItem
 * @property {string} serviceId - Reference to Service document
 * @property {string} name - Service name
 * @property {number} price - Price of service
 *
 * @typedef {Object} Sale
 * @property {string} id - Document ID
 * @property {string} customerId - Reference to Customer document
 * @property {string} staffId - Reference to Admin/Staff document
 * @property {SaleItem[]} services - Array of services in the sale
 * @property {number} advanceAmount - Advance payment
 * @property {number} totalAmount - Total sale amount
 * @property {number} paidAmount - Amount paid
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

// Export as dummy objects for reference
export const schemas = {
  admin: {
    name: 'string',
    email: 'string',
    role: 'admin|staff',
    attendance: 'array<{date, checkIn, checkOut, status, note}>',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
  customer: {
    name: 'string',
    mobile: 'string',
    email: 'string',
    country: 'string',
    place: 'string (optional)',
    state: 'string (optional)',
    city: 'string (optional)',
    pincode: 'string (optional)',
    address: 'string (optional)',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
  service: {
    name: 'string',
    description: 'string (optional)',
    isActive: 'boolean',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
  sale: {
    customerId: 'string (ref to Customer)',
    staffId: 'string (ref to Admin)',
    services: 'array<{serviceId, name, price}>',
    advanceAmount: 'number',
    totalAmount: 'number',
    paidAmount: 'number',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
};
