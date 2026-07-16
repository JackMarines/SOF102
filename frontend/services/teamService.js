// Team service — CRUD operations for teams (create, join, leave, update, kick, transfer, disband)
// ===========================

async function fetchTeamDetail(teamId) {
    return apiGet('/teams?id=' + teamId);
}

async function joinTeam(teamId) {
    return apiPost('/teams/join', { teamId: parseInt(teamId) });
}

async function leaveTeam() {
    return apiPost('/teams/leave', {});
}

async function updateTeam(data) {
    return apiPut('/teams/update', data);
}

async function transferOwnership(newOwnerId) {
    return apiPut('/teams/transfer', { newOwnerId: newOwnerId });
}

async function updateShoutout(shoutout) {
    return apiPut('/teams/shoutout', { shoutout: shoutout });
}

async function kickMember(userId) {
    return apiPost('/teams/kick', { userId: userId });
}

async function createTeam(data) {
    return apiPost('/teams/create', data);
}

async function disbandTeam() {
    return apiDelete('/teams/disband');
}
