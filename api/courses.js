export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { date, r, c } = req.query; // date = ddmmyyyy, r = numReunion, c = numCourse

    if (!date) {
        return res.status(400).json({ error: "Date manquante" });
    }

    const headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9",
        "Referer": "https://www.pmu.fr/",
        "Origin": "https://www.pmu.fr"
    };

    // Cas 1 : Récupération des partants et des rapports pour une course spécifique
    if (r && c) {
        const participantUrls = [
            `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}/R${r}/C${c}/participants`,
            `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${date}/R${r}/C${c}/participants`
        ];

        let participantsData = [];
        for (const url of participantUrls) {
            try {
                const response = await fetch(url, { headers });
                if (response.ok) {
                    const data = await response.json();
                    participantsData = data.participants || data || [];
                    break;
                }
            } catch (e) {}
        }

        let rapportsData = null;
        try {
            const rapportsUrl = `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}/R${r}/C${c}/rapports-definitifs`;
            const rapportsRes = await fetch(rapportsUrl, { headers });
            if (rapportsRes.ok) {
                rapportsData = await rapportsRes.json();
            }
        } catch (e) {}

        return res.status(200).json({
            participants: participantsData,
            rapports: rapportsData
        });
    }

    // Cas 2 : Récupération du programme global des réunions du jour
    const programmeUrls = [
        `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}?specialisation=INTERNET`,
        `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${date}`,
        `https://online.turf.pmu.fr/client/rest/v1/programme/${date}`
    ];

    for (const url of programmeUrls) {
        try {
            const response = await fetch(url, { headers });
            if (response.ok) {
                const data = await response.json();
                if (data && (data.programme || data.reunions)) {
                    // Normalisation du format si besoin
                    return res.status(200).json(data.programme ? data : { programme: data });
                }
            }
        } catch (e) {}
    }

    return res.status(500).json({ error: "Impossible de récupérer le programme officiel PMU pour cette date." });
}
