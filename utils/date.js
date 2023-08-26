function formatDate(dateString) {
    console.log(dateString)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = new Date(dateString);

    const day = date.getDate();
    const month = months[date.getMonth()];

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedMinutes = minutes.toString().padStart(2, '0');

    let daySuffix = 'th';
    if ((day === 1 || day === 21 || day === 31) && day !== 11) {
        daySuffix = 'st';
    } else if ((day === 2 || day === 22) && day !== 12) {
        daySuffix = 'nd';
    } else if ((day === 3 || day === 23) && day !== 13) {
        daySuffix = 'rd';
    }

    const time = `${hours}:${formattedMinutes}`;

    return {
        day: `${day}${daySuffix}`,
        month: month,
        time: time
    };
}


