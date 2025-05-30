const bookingModel = require('../../model/bookingModel');

// Function to check expired bookings
async function checkExpiredBookings() {
    try {
        const updatedCount = await bookingModel.checkAndUpdateExpiredBookings();
        if (updatedCount > 0) {
            console.log(`Updated ${updatedCount} expired bookings`);
        }
    } catch (error) {
        console.error('Error checking expired bookings:', error);
    }
}

// Run the check every minute
setInterval(checkExpiredBookings, 60000);

// Run initial check when server starts
checkExpiredBookings();

console.log('Expired bookings checker started'); 