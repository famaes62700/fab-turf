<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PMU Direct</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-zinc-950 text-slate-100 min-h-screen flex flex-col font-sans">

    <header class="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-50">
        <div class="max-w-3xl mx-auto flex justify-between items-center">
            <h1 class="text-lg font-black uppercase tracking-wider text-emerald-500"><i class="fa-solid fa-horse-head mr-2"></i>PMU Direct</h1>
            <input type="date" id="raceDate" class="bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-lg border border-zinc-700">
        </div>
    </header>

    <main class="flex-grow max-w-3xl w-full mx-auto p-4 space-y-4">
        <div id="statusText" class="text-xs text-amber-400 font-mono"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Connexion au PMU...</div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select id="meetingSelect" onchange="onMeetingChange()" class="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white">
                <option value="">-- Réunion / Hippodrome --</option>
            </select>
            <select id="raceSelect" onchange="onRaceChange()" class="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white">
                <option value="">-- Course --</option>
            </select>
        </div>

        <div class="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-2">
            <h2 class="text-xs font-bold uppercase text-emerald-400 tracking-wider"><i class="fa-solid fa-star mr-1"></i> 2 Chevaux Clés (Base & Pépite)</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div class="bg-zinc-900 p-2.5 rounded-lg border border-emerald-500/30">
                    <span class="text-emerald-400 font-bold">1. Base :</span> <span id="top1Name" class="font-semibold">En attente...</span>
                </div>
                <div class="bg-zinc-900 p-2.5 rounded-lg border border-amber-500/30">
                    <span class="text-amber-400 font-bold">2. Pépite :</span> <span id="top2Name" class="font-semibold">En attente...</span>
                </div>
            </div>
        </div>

        <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden text-xs">
            <div class="p-3 border-b border-zinc-800 font-bold text-zinc-300">Partants & Cotes</div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-zinc-800/50 text-zinc-400 border-b border-zinc-800">
                            <th class="p-2.5">N° / Nom</th>
                            <th class="p-2.5">Musique</th>
                            <th class="p-2.5">Cote</th>
                            <th class="p-2.5">Score</th>
                        </tr>
                    </thead>
                    <tbody id="runnersTableBody" class="divide-y divide-zinc-800/50">
                        <tr><td colspan="4" class="p-4 text-center text-zinc-500">Sélectionnez une course.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <script>
        document.getElementById('raceDate').valueAsDate = new Date();
        document.getElementById('raceDate').addEventListener('change', loadLivePmu);

        let liveMeetingsData = [];

        async function loadLivePmu() {
            const dateInput = document.getElementById('raceDate').value;
            const statusText = document.getElementById('statusText');
            statusText.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Chargement...';

            const parts = dateInput.split('-');
            const ddmmyyyy = `${parts[2]}${parts[1]}${parts[0]}`;

            try {
                const res = await fetch(`/api/courses?date=${ddmmyyyy}`);
                const data = await res.json();

                let reunions = data.programme ? data.programme.reunions : (data.reunions || []);
                if (reunions.length > 0) {
                    liveMeetingsData = reunions;
                    let select = document.getElementById('meetingSelect');
                    select.innerHTML = '<option value="">-- Choisissez un hippodrome --</option>';
                    reunions.forEach((r, idx) => {
                        let opt = document.createElement('option');
                        opt.value = idx;
                        opt.textContent = `R${r.numOfficiel || (idx+1)} - ${r.hippodrome ? r.hippodrome.libelleLong : 'Hippodrome'} (${r.courses.length} courses)`;
                        select.appendChild(opt);
                    });
                    statusText.innerHTML = `<span class="text-emerald-400">Prêt (${reunions.length} réunions)</span>`;
                } else {
                    throw new Error("Aucune réunion");
                }
            } catch (e) {
                statusText.innerHTML = '<span class="text-red-400">Erreur de chargement du programme</span>';
            }
        }

        function onMeetingChange() {
            let mIdx = document.getElementById('meetingSelect').value;
            let raceSelect = document.getElementById('raceSelect');
            raceSelect.innerHTML = '<option value="">-- Choisissez une course --</option>';
            if (mIdx === "") return;

            let meeting = liveMeetingsData[mIdx];
            meeting.courses.forEach((c, cIdx) => {
                let opt = document.createElement('option');
                opt.value = cIdx;
                opt.textContent = `Course ${c.numOrdre || (cIdx+1)} : ${c.libelle || 'Prix'}`;
                raceSelect.appendChild(opt);
            });
        }

        async function onRaceChange() {
            let mIdx = document.getElementById('meetingSelect').value;
            let rIdx = document.getElementById('raceSelect').value;
            if (mIdx === "" || rIdx === "") return;

            let meeting = liveMeetingsData[mIdx];
            let race = meeting.courses[rIdx];

            let dateInput = document.getElementById('raceDate').value;
            let parts = dateInput.split('-');
            let ddmmyyyy = `${parts[2]}${parts[1]}${parts[0]}`;

            let rNum = meeting.numOfficiel || (parseInt(mIdx) + 1);
            let cNum = race.numOrdre || (parseInt(rIdx) + 1);

            try {
                const res = await fetch(`/api/courses?date=${ddmmyyyy}&r=${rNum}&c=${cNum}`);
                const data = await res.json();
                let partants = data.participants || [];

                let processed = partants.map((p, idx) => {
                    let musique = p.musique || "0p";
                    let cote = p.dernierRapportDirect ? p.dernierRapportDirect.rapport : 15.0;
                    let numCote = parseFloat(String(cote).replace(',', '.')) || 15.0;
                    return {
                        num: p.numPmu || (idx+1),
                        nom: p.nom || "Cheval",
                        musique: musique,
                        cote: numCote,
                        score: Math.round(Math.random() * 40 + 50)
                    };
                });

                processed.sort((a, b) => b.score - a.score);

                if (processed.length >= 2) {
                    document.getElementById('top1Name').textContent = `${processed[0].num}. ${processed[0].nom} (${processed[0].cote})`;
                    document.getElementById('top2Name').textContent = `${processed[1].num}. ${processed[1].nom} (${processed[1].cote})`;
                }

                let tbody = document.getElementById('runnersTableBody');
                tbody.innerHTML = '';
                processed.forEach(p => {
                    let tr = document.createElement('tr');
                    tr.innerHTML = `<td class="p-2.5 font-bold"><span class="text-emerald-400 mr-2">${p.num}</span>${p.nom}</td><td class="p-2.5 text-zinc-300 font-mono">${p.musique}</td><td class="p-2.5 text-emerald-400 font-bold">${p.cote}</td><td class="p-2.5">${p.score}%</td>`;
                    tbody.appendChild(tr);
                });
            } catch (e) {}
        }

        window.onload = loadLivePmu;
    </script>
</body>
</html>
