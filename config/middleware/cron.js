const bookingModel = require('../../model/bookingModel');

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

setInterval(checkExpiredBookings, 60000);

checkExpiredBookings();

console.log('Expired bookings checker started'); 