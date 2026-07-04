//show all puzzles from database (page 1)
async function findAllPuzzles() {
    console.log("findAllPuzzles()");
    return apiGet('/puzzles');
}

async function getPuzzleById(id){
    console.log("getPuzzleById()");
    return apiGet('/puzzles?id='+id);
};

