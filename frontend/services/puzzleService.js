//show all puzzles from database (page 1)
async function findAllPuzzles() {
    console.log("findAllPuzzles()");
    return apiGet('/puzzles');
}

async function main() {
    const pagedata = await findAllPuzzles();
    console.log(pagedata);
}

main();