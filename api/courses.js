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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9"
    };

    // Si une réunion (r) et une course (c) sont demandées : partants ET arrivée/rapports
    if (r && c) {
        try {
            const [participantsRes, rapportsRes] = await Promise.all([
                fetch(`https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}/R${r}/C${c}/participants`, { headers }),
                fetch(`https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}/R${r}/C${c}/rapports-definitifs`, { headers }).catch(() => null)
            ]);

            let participantsData = [];
            if (participantsRes.ok) {
                participantsData = await participantsRes.json();
            }

            let rapportsData = null;
            if (rapportsRes && rapportsRes.ok) {
                rapportsData = await rapportsRes.json();
            }

            return res.status(200).json({
                participants: participantsData.participants || participantsData || [],
                rapports: rapportsData
            });

        } catch (e) {
            return res.status(500).json({ error: "Impossible de charger les données de cette course" });
        }
    }

    // Sinon, on récupère le programme complet des réunions
    const programmeUrls = [
        `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${date}`,
        `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}?specialisation=INTERNET`
    ];

    for (const url of programmeUrls) {
        try {
            const response = await fetch(url, { headers });
            if (response.ok) {
                const data = await response.json();
                if (data && data.programme && data.programme.reunions && data.programme.reunions.length > 0) {
                    return res.status(200).json(data);
                }
            }
        } catch (e) {}
    }

    return res.status(500).json({ error: "Programme PMU indisponible" });
}
