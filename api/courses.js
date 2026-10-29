export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { date, r, c } = req.query;

    if (!date) {
        return res.status(400).json({ error: "Date manquante" });
    }

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*"
    };

    if (r && c) {
        try {
            const resp = await fetch(`https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}/R${r}/C${c}/participants`, { headers });
            if (resp.ok) {
                const data = await resp.json();
                return res.status(200).json({ participants: data.participants || data || [] });
            }
        } catch (e) {}
        return res.status(500).json({ error: "Erreur partants" });
    }

    try {
        const resp = await fetch(`https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}?specialisation=INTERNET`, { headers });
        if (resp.ok) {
            const data = await resp.json();
            return res.status(200).json(data);
        }
    } catch (e) {}

    return res.status(500).json({ error: "Impossible de joindre le PMU" });
}
