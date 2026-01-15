(function () {
    'use strict';

    var api = window.SubwayBuilderAPI;
    if (!api) {
        console.error('[governmentFunding] API not available');
        return;
    }
    const { React, icons, components } = api.utils;
    const { Button, Card, CardContent, Progress, Switch, Label, Input, Badge, Slider } = components;

    const h = React.createElement;

    // Party stuff

    // P - Progressive, M - Moderate | D - Democrat, R - Republican, T - Tie | PT - Pro Transit, AT - Anti Transit, N Neutral
    const options = ['PD','MD_PT','MD_AT','MR_PT','MR_AT','MAGAR','T_PT','T_AT','DN','RN'];
    const binoptions = ['D','R'];
    const partyColors = ['#461f82','#00AEF3','#19345D','#ff7074','#E81B23','#EF7B4A','#0000FF','#FF0000'];

    // FTA Grant Colors
    const colorScale = ['#AA0000','#cc6d00','#CCCC00','#00CC00','#007dcb']

    // Contstant radii
    const EARTH_RADIUS = 6371000;
    const FTA_RADIUS = 804.672;

    // inspect a function
    function inspect2(fn, args = [], label = fn.name || '(anonymous)') {
        if (typeof fn !== 'function') {
            return;
        }
        let out;
        try {
            out = fn(...args);
        } catch (e) {
            return;
        }

        if (out && typeof out === 'object') {
            Object.keys(out).forEach(k => {
                console.log(`${label}: ${k}`);
            });
        }
    }
    // This will crash your game! Inspect the entire api
    function inspect( 
        obj,
        {
            skipKeys = [],
            skipPaths = [],
            skipTypes = [],
            maxDepth = 4,
            shouldSkip = null
        } = {},
        path = 'api',
        depth = 0,
        seen = new WeakSet()
    ) {
        if (obj == null) return;
        if (depth > maxDepth) return;

        // Prevent infinite recursion
        if (typeof obj === 'object' || typeof obj === 'function') {
            if (seen.has(obj)) return;
            seen.add(obj);
        }

        const keys = Object.getOwnPropertyNames(obj);

        for (const key of keys) {
            if (skipKeys.includes(key)) continue;

            const fullPath = `${path}.${key}`;
            if (skipPaths.includes(fullPath)) continue;

            let value;
            try {
                value = obj[key];
            } catch {
                continue;
            }

            if (skipTypes.includes(typeof value)) continue;
            if (shouldSkip?.(value, key, fullPath)) continue;

            console.log(fullPath);

            if (typeof value === 'function') {
                try {
                    inspect2(value, [], fullPath);
                } catch (e) {}
            }
            else if (typeof value === 'object' && value !== null) {
                inspect(
                    value,
                    { skipKeys, skipPaths, skipTypes, maxDepth, shouldSkip },
                    fullPath,
                    depth + 1,
                    seen
                );
            }
        }
    }

    // haversine function for distances
    function haversine(lat1, lon1, lat2, lon2) {
        const toRad = Math.PI / 180;

        const dLat = (lat2 - lat1) * toRad;
        const dLon = (lon2 - lon1) * toRad;

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * toRad) *
            Math.cos(lat2 * toRad) *
            Math.sin(dLon / 2) ** 2;

        return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
    }

    // currently unused, gets all points within one radius
    function pointsWithinRadius(points, center, radiusMeters) {
        var result = [];

        points.forEach((point) => {
            const lon = point.location[0]; const lat = point.location[1];

            const dist = haversine( center.lat,center.lon,lat,lon);

            if (dist <= radiusMeters) {
            result.push({ id, point, dist });
            }
        });

        return result;
    }

    // WIP Stuff, this defines the governmental control for each level
    var Government = {
        federal: {
            pres: options[5],
            sen: options[5],
            house: options[5]
        },
        state: {
            gov: options[1],
            sen: options[1],
            house: options[1]
        },
        local: {
            mayor: options[1],
            council: options[1]
        }
    } 

    // WIP Politics stuff, this calculates election odds
    function oddsCalc(PVI,GM,city,inc,GMN) {
        var nat = 0;
        if (inc === binoptions[0]) {
            nat = -1 * (Math.random() * (5 - 1) + 1);
        } else {
            nat = Math.random() * (9 - 2) + 2;
        }
        return {
            federal: {
                pres: 50 + nat,
                sen: 45 + nat,
                house: GMN + nat
            },
            state: {
                gov: 50 + PVI + nat,
                sen: 50 + GM + PVI + nat,
                house: 50 + GM + PVI + nat
            },
            local: {
                mayor: city + nat,
                council: city + nat
            }
        }
    } 

    // WIP politics stuff, this is for setting the state and local government based on the city
    function defGov(before,a,b,c,d,e) {
        return {
            federal: {
            pres: before.federal.pres,
            sen: before.federal.sen,
            house: before.federal.house
            },
            state: {
                gov: options[a],
                sen: options[b],
                house: options[c]
            },
            local: {
                mayor: options[d],
                council: options[e]
            }
        }
    }

    // City to Province / State
    const ctp = (city) => {
        if (city == "NYC") {
            return "NY";
        } else if (city === "DAL" || city === "HOU" || city === "AUS") {
            return "TX";
        } else if (city === "SF" || city === "SD" || city === "LA") {
            return "CA";
        } else if (city === "CHI") {
            return "IL";
        } else if (city === "MIA") {
            return "FL";
        } else if (city === "PHX") {
            return "AZ";
        } else if (city === "ATL") {
            return "GA";
        } else if (city === "SEA") {
            return "WA";
        } else if (city === "PHI"  || city === "PIT") {
            return "PA";
        } else if (city === "DEN") {
            return "CO";
        } else if (city === "DET") {
            return "MI";
        } else if (city === "MIN") {
            return "MN";
        } else if (city === "POR") {
            return "OR";
        } else if (city === "STL") {
            return "MO";
        } else if (city === "COL" || city === "CLE" || city === "CIN") {
            return "OH";
        } else {
            return "Generic";
        }
    };

    // Gets a random number from -3 to 3
    function getSeed() {
        return Math.random() * 6 - 3;
    }
    
    // Gets a Republican of a random type
    function getR() {
        hold = Math.random() * 100 + 1;
        if (hold <= 80) {
            return 5;
        } else if (hold <= 87) {
            return 4;
        } else if (hold <= 95) {
            return 9;
        } else {
            return 3;
        }
    }

    // Gets a Democrat of a random type
    function getD() {
        hold = Math.random() * 100 + 1;
        if (hold <= 30) {
            return 0;
        } else if (hold <= 60) {
            return 1;
        } else if (hold <= 90) {
            return 2;
        } else {
            return 8;
        }
    }

    // Determines if a tie is pro or anti-transit
    function getT() {
        hold = Math.random() * 2 + 1;
        if (hold == 1) {
            return 6;
        } else {
            return 7;
        }
    }

    // WIP Politics stuff, this runs an election
    function Election(o,g,n,s,l) {
        const nat = Math.random() * 100 + 1;
        const state = Math.random() * 100 + 1;
        const loc = Math.random() * 100 + 1;
        const oa = {
            p: getSeed() + o.federal.pres,
            fs: getSeed() + o.federal.sen,
            fh: getSeed() + o.federal.house,
            g: getSeed() + o.state.gov,
            ss: getSeed() + o.state.sen,
            sh: getSeed() + o.state.house,
            m: getSeed() + o.local.mayor,
            c: getSeed() + o.local.council
        }
        if (n) {
            if (nat>oa.p) { g.federal.pres = options[getR()]; } else if (nat == p) {g.federal.pres = getT()} else {g.federal.pres = getD()}
            if (nat>oa.fs) { g.federal.sen = options[getR()]; } else if (nat == p) {g.federal.sen = getT()} else {g.federal.sen = getD()}
            if (nat>oa.fh) { g.federal.house = options[getR()]; } else if (nat == p) {g.federal.house = getT()} else {g.federal.house = getD()}
        }
        if (s) {
            if (state>oa.g) { g.state.gov = options[getR()]; } else if (state == p) {g.state.gov = getT()} else {g.state.gov = getD()}
            if (state>oa.ss) { g.state.sen = options[getR()]; } else if (state == p) {g.state.sen = getT()} else {g.state.sen = getD()}
            if (state>oa.sh) { g.state.house = options[getR()]; } else if (state == p) {g.state.house = getT()} else {g.state.house = getD()}
        }
        if (l) {
            if (loc>oa.m) { g.local.mayor = options[getR()]; } else if (loc == p) {g.local.mayor = getT()} else {g.local.mayor = getD()}
            if (loc>oa.c) { g.local.council = options[getR()]; } else if (loc == p) {g.local.council = getT()} else {g.local.council = getD()}
        }
        return g;
    }
    // Sets base odds and gives them a default
    var baseOdds = {
        PVI: 0,
        GM: 0,
        city: 75,
        inc: binoptions[1],
        GMN: -3
    }
    // initializes current odds using base odds
    var currentOdds = baseOdds;

    // stores the budgets of the various levels of government
    // stateper is the % of the state budget available to a city
    var budgetCache = {
        fed: 1500000000,
        state: 1000000,
        stateper: 100,
        local: 100000,
        user: 0
    };

    // These will be used to prevent constantly going through all demand again 
    var popsMapCache = null;
    var pointsCache = null;
    
    // On city load, define the budget
    api.hooks.onCityLoad((cityCode) => {
        budgetCache.fed = 1500000000;
        console.log(`Loaded city: ${cityCode}`);
        const prov = ctp(cityCode);
        if (prov === 'NY') {
            baseOdds.PVI = 8; baseOdds.GM = 5; baseOdds.city = 75;
            budgetCache.state = 1.05 * 10**9; budgetCache.local = 200 * 10**3;
            Government = defGov(Government,8,8,8,1,1);
        } else if (prov === 'CA') {
            baseOdds.PVI = 12; baseOdds.GM = 10; baseOdds.city = 80;
            budgetCache.state = 100 * 10**6;
            if (cityCode === 'SF') {
                budgetCache.local = 400 * 10**6; budgetCache.stateper = 25;
                Government = defGov(Government,2,8,1,8,2);
            } else if (cityCode === 'SD') {
                budgetCache.local = 2 * 10**6; budgetCache.stateper = 10;
                Government = defGov(Government,2,8,1,1,1);
            } else if (cityCode === 'LA') {
                budgetCache.local = 2.2 * 10**9; budgetCache.stateper = 25;
                Government = defGov(Government,2,8,1,1,2);
            }
        } else if (prov === 'TX') {
            baseOdds.PVI = -6; baseOdds.GM = -10; baseOdds.city = 65;
            if (cityCode === 'HOU') {
                Government = defGov(Government,9,9,9,3,3);
            } else if (cityCode === 'DAL') {
                Government = defGov(Government,9,9,9,2,8);
            } else if (cityCode === 'AUS') {
                Government = defGov(Government,9,9,9,2,1);
            }
        } else if (prov === 'MN') {
            baseOdds.PVI = 3; baseOdds.GM = 0; baseOdds.city = 90;
            Government = defGov(Government,2,2,7,8,1);
        } else {
            Government = defGov(Government,9,8,8,1,3);
        }
        currentOdds = oddsCalc(baseOdds.PVI,baseOdds.GM,baseOdds.city,baseOdds.inc,baseOdds.GMN);
        const { popsMap, points } = api.gameState.getDemandData();
        popsMapCache = popsMap;
        pointsCache = points;
    });

    // Get all points which are within a given radius of any of a given series of points
    function pointsWithinRadii(points, centers, radiusMeters) {
        var ids = [];
        var pts = [];

        points.forEach((point,id) => {
            centers.forEach((center) => {
                const lon = point.location[0];
                const lat = point.location[1];

                const dist = haversine(center.lat,center.lon,lat,lon);

                if (dist <= radiusMeters) {
                    ids.push(id)
                    pts.push(point);
                }
            });
        });

        const result = {
            idList: ids,
            pointList: pts
        }

        return result;
    }
    
    // Election Simulator - Politics part not yet implemented
    api.hooks.onDayChange((day) => {
        d = day+6;
        if (d%4 == 0) {
            Government = Election(currentOdds,Government,true,true,false);
            if ((Government.federal.pres).contains("R")) {baseOdds.inc = binoptions[1];} else {baseOdds.inc = binoptions[2];}
            if (d%10 != 0) {currentOdds = oddsCalc(baseOdds.PVI,baseOdds.GM,baseOdds.city,baseOdds.inc,baseOdds.GMN);}
        } else if (d%2 == 0) {
            Government = Election(currentOdds,Government,false,true,false);
        } else if (d%3 != 0) {
            Government = Election(currentOdds,Government,false,false,true);
        }
        if (d%10 == 0) {
            baseOdds.GM = baseOdds.GM + getSeed()/2;
            baseOdds.GMN = baseOdds.GMN + getSeed()/2;
            currentOdds = oddsCalc(baseOdds.PVI,baseOdds.GM,baseOdds.city,baseOdds.inc,baseOdds.GMN);
        }
    });

    // Simple function that returns how much each level pays for your project 
    function Contribution(key,percent,cost) {
        if (percent[key] === 0) {return 0;}
        const cont = cost*percent[key]/100;
        return cont;
    }

    // Part of WIP elections stuff, this takes the party of a politican and returns how much they help or hurt transit projects.
    function getWeight(p) {
        if (p === options[0]) {
            return 45;
        } else if (p == options[1]) {
            return 25;
        } else if (p == options[2]) {
            return -5;
        } else if (p == options[3]) {
            return 10;
        } else if (p == options[4]) {
            return -25;
        } else if (p == options[5]) {
            return -50;
        } else if (p == options[6]) {
            return 3;
        } else if (p == options[7]) {
            return -3;
        } else if (p == options[8]) {
            return 5;
        } else if (p == options[9]) {
            return 0;
        }
    }

    // Part of WIP elections stuff, this adds all the weights together
    function calcDifficulty(g) {
        return diff = {
            fed: p.getWeight(g.federal.pres)+p.getWeight(g.federal.sen)+p.getWeight(g.federal.house),
            state: p.getWeight(g.state.gov)+p.getWeight(g.state.sen)+p.getWeight(g.state.house),
            local: p.getWeight(g.local.mayor)+p.getWeight(g.local.council)
        }
    }
    
    // Fairly obvious, this gets the maximum % a level of gov can spend based on their budget
    function getMaxByBudget(key, cost, budget) {
        if (cost <= 0) return 100;
        var budgetVal = budget[key];
        if (key === 'state') {budgetVal *= stateper/100;}
        return Math.min((budgetVal / cost) * 100, 100);
    }

    // This stores the values after you close the menu
    var percentHold = {
        fed: 60,
        state: 0,
        local: 0,
        user: 40
    }

    // takes population and radius in meters and returns population density
    function densityInImperial (p,r) {
        const r_mi = r * 39.37/5280/12;
        const area = Math.PI * r_mi**2;
        const dens = p/area;
        return dens;
    }

    // Converts FTA numerical score to the name the FTA uses for that score
    function scoreToText(score) {
        score = Math.round(score);
        switch (score) {
            case 5: return "High";
            case 4: return "Medium-High";
            case 3: return "Medium";
            case 2: return "Medium-Low";
            default: return "Low"
        }
    }

    // Approximates the FTA Land Use Rating as good as you can get with in game data
    function LandUseScore(list) {
        const withinStations = list.pointList;
        var sumres = 0; var sumjob = 0;
        withinStations.forEach((p) => {
            sumres += p.residents;
            sumjob += p.jobs;
        });
        console.log("Residents: "+sumres+" | Jobs: "+sumjob);
        const density = densityInImperial(sumres,FTA_RADIUS);
        console.log("Density: "+density)
        var densScore = 0; var jobScore = 0;
        switch(true) {
            case (sumres >= 15000): densScore = 5; break;
            case (sumres >= 9600): densScore = 4; break;
            case (sumres >= 5760): densScore = 3; break;
            case (sumres >= 2560): densScore = 2; break;
            default: densScore = 1;
        }
        switch(true) {
            case (sumjob >= 220000): jobScore = 5; break;
            case (sumjob >= 140000): jobScore = 4; break;
            case (sumjob >= 70000): jobScore = 3; break;
            case (sumjob >= 40000): jobScore = 2; break;
            default: jobScore = 1;
        }
        console.log(densScore);
        console.log(jobScore);
        const final = {
            luScore: (2*densScore+jobScore)/3,
            denScore: densScore,
            jobScore: jobScore
        }
        return final;
    }
    
    // returns two lists, one of pops and one of those pops' ids.
    function popsWithinStations(list){
        var popIdList = [];
        const withinStations = list.pointList;
        withinStations.forEach((p) => {
            const popids = p.popIds;
            popids.forEach((pop) => {
                popIdList.push(pop);
            });
        });

        var ps = [];

        popsMapCache.forEach((pop) => {
            if (popIdList.includes(pop.id)) {
                ps.push(pop);
            }
        });
        const result = {
            pops: ps,
            idList: popIdList
        }

        return result;
    }

    // Roughly calculates the amount of commutes within a blueprint
    function commutesCalc(popSet,withinStation,factor=1) {
        var commuteSum = 0; const ps = popSet.pops; const ids = withinStation.idList;
        ps.forEach((pop) => {
            const commuteLoc = pop.jobId; const size = pop.size;
            if (ids.includes(commuteLoc)) {
                commuteSum += size;
            }
        });
        return commuteSum*factor;
    }
    
    // Calculates the FTA Congestion Relief Rating using Commutes Calc
    function CongestionScore(popSet,withinStation,factor=1) {
        const sum = commutesCalc(popSet,withinStation,factor);
        switch(true) {
            case (sum >= 18000): return 5; 
            case (sum >= 10000): return 4; 
            case (sum >= 2500): return 3; 
            case (sum >= 500): return 2; 
            default: return 1;
        }
    }

    // Calculates the final FTA Rating, not done yet
    function finalScore(landScore,congScore,finScore) {
        const justScore = (landScore+congScore)/2;
        const finalScore = (justScore+finScore)/2;
        return finalScore;
    }

    // Whether the accept button can be pressed or not
    var acceptRejectHold = false;

    // Menu that shows FTA Ratings
    function EvalMenu() {
        const stations = api.gameState.getStations();
        var statlocs = [];
        stations.forEach((stat) => {
            const hold = {lat: stat.coords[1], lon:stat.coords[0], statId: stat.id};
            statlocs.push(hold)
        });

        const withinStations = pointsWithinRadii(pointsCache,statlocs,FTA_RADIUS);
        console.log("withinStation array length:", withinStations.pointList?.length);
        const relpops = popsWithinStations(withinStations);
        const {luScore, denScore, jobScore} = LandUseScore(withinStations);
        const comms = CongestionScore(relpops,withinStations,0.85);

        console.log(luScore);
        console.log(relpops.pops?.length);
        console.log(comms);

        return h('div', { className: 'space-y-4' }, [
            // Header stats
            h('div', { key: 'header', className: 'flex items-center justify-between' }, [
                h('div', { key: 'left', className: 'flex items-center gap-2' }, [
                    h('div', { key: 'pct', className: 'text-xl font-semibold text-primary' }, 'FTA CIG Evaluation: '),
                ]),
            ]),
            h('div', { key: 'label-row', className: 'flex gap-2 mb-2'}, [
                h('div', {
                    key: 'label',
                    className: 'font-medium',
                    style: {
                        alignItems: 'center',
                        fontSize: '1rem'
                    }
                }, 'Land Use Rating:'),
                h(Badge, {
                    key: 'badge',
                    variant: 'secondary',
                    className: `font-medium items-bottom`,
                    style: {
                        fontSize: '0.75rem',
                        alignItems: 'center',
                        background: colorScale[luScore-1]+'33',
                        color: colorScale[luScore-1]
                    }
                }, scoreToText(luScore))
            ]),
            h('div', { key: 'label-row', className: 'flex gap-2 mb-2'}, [
                h('div', {
                    key: 'label',
                    className: 'font-medium',
                    style: {
                        fontSize: '0.7rem'
                    }
                }, 'Population Density Subscore:'),
                h(Badge, {
                    key: 'badge',
                    variant: 'secondary',
                    className: `font-medium items-bottom`,
                    style: {
                        fontSize: '0.5rem',
                        background: colorScale[denScore-1]+'33',
                        color: colorScale[denScore-1],
                    }
                }, scoreToText(denScore))
            ]),
            h('div', { className: 'text-sm font-medium'}, "Employment Served Subscore: "+scoreToText(jobScore)+" (1/3)")
        ]);
    }

    // Menu that will be renamed later, this handles the grant financial value and stuff
    function PoliticMenu() {
        const tracks = api.gameState.getTracks(); 
        const blueprintTracks = tracks.filter((t) => t.displayType === 'blueprint');
        const cost = (api.gameState.calculateBlueprintCost(blueprintTracks)).totalCost;

        // Percents for each level
        var [percents, setPercents] = React.useState({
            fed: percentHold.fed || 60,
            state: percentHold.state || 0,
            local: percentHold.local || 0,
            user: percentHold.user || 40
        });

        // Whether the accept button can be pressed or not
        var [acceptReject, setacceptReject] = React.useState(acceptRejectHold);

        // self explanatory
        function getTotal() {
            return percents.fed + percents.state + percents.local + percents.user;
        }

        const TOTAL = 100;
        const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

        function updatePercents(key, value, budget) {
            setPercents(prev => {
                // Hard caps on the sliders
                const hardCaps = {
                fed: 60,
                state: getMaxByBudget('state', cost, budget),
                local: getMaxByBudget('local', cost, budget),
                user: TOTAL
                };

                let newVal = value;
                newVal = clamp(newVal, 0, hardCaps[key]);

                let updated = { ...prev, [key]: newVal };

                // budget remaining
                let remaining = TOTAL - newVal;
                const otherKeys = Object.keys(prev).filter(k => k !== key);

                // dynamic max based on where the sliders are
                const maxes = {
                    fed: Math.min(60, TOTAL),
                    state: Math.min(hardCaps.state, TOTAL - updated.fed),
                    local: Math.min(hardCaps.local, TOTAL - updated.fed - updated.state),
                    user: Math.min(hardCaps.user, TOTAL - updated.fed - updated.state - updated.local)
                };

                // redistributes to get back to 100%
                let otherTotal = otherKeys.reduce((s, k) => s + prev[k], 0);

                if (otherTotal === 0) {
                const even = remaining / otherKeys.length;
                otherKeys.forEach(k => {
                    updated[k] = clamp(even, 0, maxes[k]);
                });
                } else {
                otherKeys.forEach(k => {
                    const share = (prev[k] / otherTotal) * remaining;
                    updated[k] = clamp(share, 0, maxes[k]);
                });
                }

                // double checks that nobody escaped
                let diff = TOTAL - Object.values(updated).reduce((a, b) => a + b, 0);

                const order = [key, ...otherKeys];

                for (const k of order) {
                    if (diff === 0) break;

                    const cap = maxes[k];
                    const room = diff > 0
                        ? cap - updated[k]
                        : updated[k];

                    if (room <= 0) continue;

                    const delta = Math.sign(diff) * Math.min(Math.abs(diff), room);
                    updated[k] += delta;
                    diff -= delta;
                }
                updated[key] = clamp(
                    updated[key],
                    0,
                    hardCaps[key]
                );
                const sumExceptLocal = updated.fed + updated.state + updated.user;
                updated.local = clamp( TOTAL - sumExceptLocal, 0, hardCaps.local );
                return updated;
            });
        }

        // Adds the grant money to the user's account and disables the button
        function acceptGrant(p,c,budget) {
            const total = Contribution('fed',p,c) + Contribution('state',p,c) + Contribution('local',p,c);
            budget.fed -= Contribution('fed',p,c); budget.state -= Contribution('state',p,c);
            budget.stateper -= Contribution('state',p,c)/c*100; budget.local -= Contribution('local',p,c);
            console.log(total);
            api.actions.addMoney(total);
            setacceptReject(true);
        }

        // Button to accept the grant
        var acceptButton = () => {
            return h(Button, {
                className: 'flex gap-4 justify-center text-xs p-2 rounded border-2 border-green-500 bg-green-500/20 text-green-400 hover:bg-green-500/30',
                onClick: () => acceptGrant(percents,cost),
                disabled: acceptReject
            }, 'Accept')
        }

        const [inputDrafts, setInputDrafts] = React.useState({});

        // duration of the grant for implementing multi-year grant
        const [years, setYears] = React.useState(1);

        // reset percents back to default
        function resetPercents() {
            setYears([1]);
            setPercents({
                fed: 60,
                state: 0,
                local: 0,
                user: 40
            })
        }

        // slider which sets the multi-year grant
        const createDurationSlider = (label, min, max) => {
            console.log(years, typeof years);
            return h('div', { className: 'mb-4' }, [
                h('div', {key: 'label-row', className: 'flex items-center justify-between mb-2'}, [
                    h('div', { className: 'text-sm font-medium'}, label),
                    h('div', { className: 'text-sm font-medium'}, `${years} year${years === 1 ? '' : 's'}`)
                ]),
                h('input', {
                    type: 'range',
                    min: min,
                    max: max,
                    step: 1,
                    value: years,
                    onChange: (e) => {
                        setYears(Number(e.target.value));
                    },
                    className: 'w-full h-2 bg-input rounded-lg appearance-none cursor-pointer',
                    style: {
                        background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((years - min) / (max - min)) * 100}%, #e5e7eb ${((years - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
                        WebkitAppearance: 'none',
                        height: '8px',
                        borderRadius: '4px'
                    }
                }),
            ]);
        };
        // slider which sets feds, state, and local values
        const createStatSlider = (label, statKey, min, max, step, unit = '%') => {
            const value = percents[statKey];

            var budget = {
                fed: budgetCache.fed * years,
                state: budgetCache.state * years,
                stateper: budgetCache.stateper,
                local: budgetCache.local * years,
                user: parseFloat(api.gameState.getBudget()) * years
            }
            const maxes = {
                fed: 60,
                state: Math.min(100 - percents.fed, getMaxByBudget('state', cost, budget)),
                local: Math.min(100 - percents.fed - percents.state, getMaxByBudget('local', cost, budget)),
                user: 100 - percents.fed - percents.state - percents.local
            };
            var max = maxes[statKey];
            const draft = inputDrafts[statKey] ?? value.toFixed(2);
            const sliderValue = draft ? parseFloat(draft) || 0 : value;
            const displayValue = `${value.toLocaleString()}`;
            if (max <= 1) {step = max/20;}
            var mb = budget[statKey];
            if (statKey == 'fed') {
                mb = mb*0.6;
            }
            return h('div', { key: statKey, className: 'mb-4' }, [
                h('div', {
                    key: 'label-row',
                    className: 'flex items-center mb-2'
                }, [
                    h('label', {
                        className: 'text-sm font-medium'
                    }, label),
                    h('label', {
                        className: 'text-sm font-medium ml-auto mr-auto',
                        style: {float:'center'},
                    }, '$'+Math.round(value/100*cost).toLocaleString()+'/$'+Math.round(mb).toLocaleString()),
                    h('input', {
                        type: 'text',
                        inputmode: 'numeric',
                        value: inputDrafts[statKey] ?? value.toFixed(2),
                        className: 'rounded-sm bg-transparent font-mono appearance-none cursor-pointer ml-auto',
                        style: {
                            textAlign: 'right',
                            marginRight: '0',
                            width: '5ch',
                            fontSize: '0.875rem',
                            lineHeight: '1.25rem'
                        },
                        onChange: (e) => {
                            setInputDrafts(d => ({
                            ...d,
                            [statKey]: e.target.value
                            }));
                        },
                        onKeyDown: (e) => {
                            if (e.key === 'Enter') {
                            const v = parseFloat(e.target.value);
                            if (!Number.isNaN(v)) {
                                updatePercents(statKey, v,budget);
                            }
                            setInputDrafts(d => {
                                const copy = { ...d };
                                delete copy[statKey];
                                return copy;
                            });
                            }
                        },
                        onBlur: () => {
                            setInputDrafts(d => {
                            const copy = { ...d };
                            delete copy[statKey];
                            return copy;
                            });
                        }
                    }),
                    h('label', {
                        className: 'font-mono rounded-sm bg-transparent appearance-none cursor-pointer',
                        style: {
                            fontSize: '0.8rem',
                            lineHeight: '1.25rem',
                            verticalAlign: 'text-bottom'
                        }
                    }, unit),
                ]),
                h('input', {
                    type: 'range',
                    min: min,
                    max: max,
                    step: step,
                    value: sliderValue,
                    onChange: (e) => {
                        updatePercents(statKey, parseFloat(e.target.value),budget);
                        percentHold = percents;
                    },
                    className: 'w-full h-2 bg-input rounded-lg appearance-none cursor-pointer',
                    style: {
                        background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
                        WebkitAppearance: 'none',
                        height: '8px',
                        borderRadius: '4px'
                    }
                })
            ]);
        };

        // stat slider specialized for the user since it absorbs everything remaining if needed
        const userAmountSlider = (label, statKey, min, max, step, unit = '') => {
            const value = percents[statKey];
            const draft = inputDrafts[statKey] ?? value.toFixed(2);
            const sliderValue = draft ? parseFloat(draft) || 0 : value;
            const displayValue = `${value.toLocaleString()}`;
            var budget = {
                fed: budgetCache.fed * years,
                state: budgetCache.state * years,
                stateper: budgetCache.stateper,
                local: budgetCache.local * years,
                user: parseFloat(api.gameState.getBudget()) * years
            }
            if (max <= 1) {step = max/20;}
            var mb = api.gameState.getBudget();
            return h('div', { key: statKey, className: 'mb-4' }, [
                h('div', {
                    key: 'label-row',
                    className: 'flex items-center mb-2'
                }, [
                    h('label', {
                        className: 'text-sm font-medium'
                    }, label),
                    h('label', {
                        className: 'text-sm font-medium ml-auto mr-auto',
                        style: {float:'center'},
                    }, '$'+Math.round(value/100*cost).toLocaleString()+'/$'+Math.round(mb).toLocaleString()),
                    h('input', {
                        type: 'text',
                        inputmode: 'numeric',
                        value: inputDrafts[statKey] ?? value.toFixed(2),
                        className: 'rounded-sm bg-transparent font-mono appearance-none cursor-pointer ml-auto',
                        style: {
                            textAlign: 'right',
                            marginRight: '0',
                            width: '5ch',
                            fontSize: '0.875rem',
                            lineHeight: '1.25rem'
                        },
                        onChange: (e) => {
                            setInputDrafts(d => ({
                            ...d,
                            [statKey]: e.target.value
                            }));
                        },
                        onKeyDown: (e) => {
                            if (e.key === 'Enter') {
                            const v = parseFloat(e.target.value);
                            if (!Number.isNaN(v)) {
                                updatePercents(statKey, v,budget);
                            }
                            setInputDrafts(d => {
                                const copy = { ...d };
                                delete copy[statKey];
                                return copy;
                            });
                            }
                        },
                        onBlur: () => {
                            setInputDrafts(d => {
                            const copy = { ...d };
                            delete copy[statKey];
                            return copy;
                            });
                        }
                    }),
                    h('label', {
                        className: 'font-mono rounded-sm bg-transparent appearance-none cursor-pointer',
                        style: {
                            fontSize: '0.8rem',
                            lineHeight: '1.25rem',
                            verticalAlign: 'text-bottom'
                        }
                    }, unit),
                ]),
                h('input', {
                    type: 'range',
                    inputmode: 'numeric',
                    min: min,
                    max: max,
                    step: step,
                    value: sliderValue,
                    onChange: (e) => {
                        updatePercents(statKey, parseFloat(e.target.value),budget);
                    },
                    className: 'w-full h-2 bg-input rounded-lg appearance-none cursor-pointer',
                    style: {
                        background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
                        WebkitAppearance: 'none',
                        height: '8px',
                        borderRadius: '4px'
                    }
                })
            ]);
        };
        

        return h('div', { className: 'space-y-4' }, [
            h('div', { key: 'header', className: 'flex items-center justify-between' }, [
                h('div', { key: 'left', className: 'flex items-center gap-2' }, [
                    h('span', { key: 'pct', className: 'text-xl font-semibold text-primary' }, 'Project Cost: '),
                    h('span', { key: 'pct', className: 'text-xl font-bold' }, '$' + Math.round(cost).toLocaleString())
                ]),
                h('div', { key: 'right', className: 'text-right' }, [
                    h('div', { key: 'total', className: 'text-lg font-semibold' }, parseFloat(getTotal()).toLocaleString() + '%'),
                ]),
            ]),
            h('div', { key: 'header', className: 'space-y-3' }, [
                createStatSlider('Fed Contribution', 'fed', 0, 100, 0.1, '%'),
            ]),
            h('div', { key: 'header', className: 'space-y-3' }, [
                createStatSlider('State Contribution', 'state', 0, 100, 0.1, '%'),
            ]),
            h('div', { key: 'header', className: 'space-y-3' }, [
                createStatSlider('Local Contribution', 'local', 0, 100, 0.1, '%'),
            ]),
            h('div', { key: 'header', className: 'space-y-3' }, [
                userAmountSlider('Agency Contribution', 'user', 0, 100, 0.1, '%'),
            ]),
            h('div', { key: 'header', className: 'space-y-3' }, [
                createDurationSlider('Contract Duration', 1, 5),
            ]),
            h('div', { key: 'legend', className: 'flex gap-4 justify-center text-xs' }, [
                acceptButton(),
                h(Button, {
                    className: 'flex gap-4 justify-center text-xs p-2 rounded border-2 border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30',
                    onClick: () => resetPercents()
                }, 'Reset')
            ]),
        ]);
    }

    // grants panel
    api.ui.addFloatingPanel({
        id: 'grants',
        icon: 'Landmark',
        tooltip: 'Federal, State, and Local Funding',
        title: 'Grants',
        size: { width: 600, height: 600 },
        render: PoliticMenu,
    });
    // book panel
    api.ui.addFloatingPanel({
        id: 'eval',
        icon: 'Book',
        tooltip: 'FTA Evaluation',
        title: 'FTA Evaluation',
        size: { width: 600, height: 600 },
        render: EvalMenu,
    });

    api.ui.showNotification('Politics loaded!', 'success');
    console.log('[governmentFunding] Loaded');
})();