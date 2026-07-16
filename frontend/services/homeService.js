// Home service — fetch dynamic home page data (team members, weekly puzzles, activity)
// ===========================

async function fetchHome() {
    return apiGet('/home');
}
