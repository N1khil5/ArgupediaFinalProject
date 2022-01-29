export function evaluate() {
    let [winning, losing, undec] = [[], [], []]
    const argu = JSON.parse(localStorage.getItem('arguments'));
    if (argu == null) {
    } else {
        const argKeys = Object.keys(argu)
        const allAttacks = argKeys.map(argId => {
            const relations = argu[argId].attackRelation
            let updateRel = []
            relations.forEach(relation => {
                updateRel.push(relation)
                if (relation.charAt(2) == "c") {
                    updateRel.push(argId)
                }
            });
            return updateRel;
        }).flat();

        // Look for arguments that are not attacked by any argument, add those arguments to winning
        const allAttacksIDs = allAttacks.map(argAttack => argAttack.charAt(0));
        const idNotAttacked = argKeys.filter(argId => !allAttacksIDs.includes(argId))
        winning.push(...idNotAttacked)

        const attackRelWinning = winning.map(argId => {
            const relations = argu[argId].attackRelation
            let updateRel = []
            relations.forEach(relation => {
                updateRel.push(relation)
                if (relation.charAt(2) == "c") {
                    updateRel.push(argId)
                }
            });
            return updateRel;
        }).flat();

        // Look for arguments attacked by winning arguments, these arguments are added to losing arguments.
        const losingAttackIDs = attackRelWinning.map(lossAttack => lossAttack.charAt(0));
        losing.push(...losingAttackIDs)

        //Add another 'winning' tag for any arguments that only attack out arguments. 
        const nonWinningArgKeys = argKeys.filter(argKey => !winning.includes(argKey));

        let connectSourceAndAttack = {}
        nonWinningArgKeys.forEach(nonWinKey => {
            const argRel = argu[nonWinKey].attackRelation
            argRel.forEach(argAttack => {
                const argId = argAttack.charAt(0)
                if (connectSourceAndAttack[argId]) {
                    let attacked = connectSourceAndAttack[argId]
                    attacked.push(nonWinKey)
                    connectSourceAndAttack[argId] = attacked
                } else {
                    const attacked = [nonWinKey]
                    connectSourceAndAttack[argId] = attacked
                }
            });
        });

        const getKeyConnect = Object.keys(connectSourceAndAttack)
        const newWinningID = getKeyConnect.filter(attackedID => {
            const attackers = connectSourceAndAttack[attackedID]
            return attackers.every(attacker => losing.includes(attacker))
        });
        winning.push(...newWinningID)

        // Any argument not considered as IN or OUT above is considered as UNDEC here. 
        const undecArgs = argKeys.filter(argId => !winning.includes(argId) && !losing.includes(argId))
        undec.push(...undecArgs)

        // Check voting here, if tied, remain as UNDEC. Else let larger votes = 'winning' and fewer votes = 'losing' and remove attack from losing to winning argument.
        undec.forEach(undecId => {
            const undecArg = argu[undecId]
            undecArg.attackRelation.forEach(undecArgRel => {
                const attackingID = undecArgRel.charAt(0)
                const isClaim = undecArgRel.charAt(2) == 'c'
                if (undec.includes(attackingID) && isClaim) {
                    const undecArgVotes = undecArg.votes
                    const undecRelVotes = argu[attackingID].votes
                    if (undecArgVotes > undecRelVotes) {
                        winning.push(undecId)
                    } else if (undecArgVotes < undecRelVotes) {
                        winning.push(attackingID)
                    }
                }
            })
        })
        console.log(winning)
        return winning;

    }
}
