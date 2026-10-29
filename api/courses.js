export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { date } = req.query; // Format ddmmyyyy

    if (!date) {
        return res.status(400).json({ error: "Date manquante" });
    }

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9"
    };

    const endpoints = [
        `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${date}`,
        `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}?specialisation=INTERNET`
    ];

    for (const url of endpoints) {
        try {
            const response = await fetch(url, { headers });
            if (response.ok) {
                const data = await response.json();
                if (data && data.programme && data.programme.reunions && data.programme.reunions.length > 0) {
                    return res.status(200).json(data);
                }
            }
        } catch (e) {
            // Test du second point d'accès
        }
    }

    return res.status(500).json({ error: "PMU temporairement indisponible pour cette date" });
}
