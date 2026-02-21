/**
 * Calculate consensus from worker submissions for BBOX tasks.
 * @param {Array<{ worker_address: string, selected_tiles: number[] }>} submissions
 * @returns {{ consensusTiles: number[], correctWorkers: string[] }}
 */
export function calculateConsensus(submissions) {
    if (!submissions || submissions.length === 0) {
        return { consensusTiles: [], correctWorkers: [] };
    }

    let maxTileIndex = 0;
    submissions.forEach(sub => {
        (sub.selected_tiles || []).forEach(idx => {
            if (idx > maxTileIndex) maxTileIndex = idx;
        });
    });

    const tileCounts = new Array(maxTileIndex + 1).fill(0);
    submissions.forEach(sub => {
        (sub.selected_tiles || []).forEach(tileIndex => {
            if (tileIndex >= 0 && tileIndex < tileCounts.length) {
                tileCounts[tileIndex]++;
            }
        });
    });

    const threshold = Math.ceil(submissions.length / 2);

    const consensusTiles = tileCounts
        .map((count, index) => ({ index, count }))
        .filter(tile => tile.count >= threshold)
        .map(tile => tile.index);

    console.log(`  Tile votes: ${JSON.stringify(tileCounts)}`);
    console.log(`  Threshold: ${threshold}, Consensus tiles: [${consensusTiles}]`);

    const consensusSorted = [...consensusTiles].sort((a, b) => a - b);

    const correctWorkers = submissions
        .filter(sub => {
            const selected = [...(sub.selected_tiles || [])].sort((a, b) => a - b);
            return (
                selected.length === consensusSorted.length &&
                selected.every((tile, i) => tile === consensusSorted[i])
            );
        })
        .map(sub => sub.worker_address);

    return { consensusTiles, correctWorkers };
}

/**
 * Calculate consensus for Image Classification (yes/no) tasks.
 * @param {Array<{ worker_address: string, classification_answer: string }>} submissions
 * @returns {{ consensusAnswer: string, correctWorkers: string[] }}
 */
export function calculateClassificationConsensus(submissions) {
    if (!submissions || submissions.length === 0) {
        return { consensusAnswer: null, correctWorkers: [] };
    }

    let yesCount = 0;
    let noCount = 0;

    submissions.forEach(sub => {
        if (sub.classification_answer === 'yes') yesCount++;
        else if (sub.classification_answer === 'no') noCount++;
    });

    console.log(`  Classification votes — yes: ${yesCount}, no: ${noCount}`);

    const threshold = Math.ceil(submissions.length / 2);
    let consensusAnswer = null;

    if (yesCount >= threshold) consensusAnswer = 'yes';
    else if (noCount >= threshold) consensusAnswer = 'no';

    console.log(`  Threshold: ${threshold}, Consensus: ${consensusAnswer}`);

    const correctWorkers = consensusAnswer
        ? submissions
            .filter(sub => sub.classification_answer === consensusAnswer)
            .map(sub => sub.worker_address)
        : [];

    return { consensusAnswer, correctWorkers };
}

export default { calculateConsensus, calculateClassificationConsensus };
