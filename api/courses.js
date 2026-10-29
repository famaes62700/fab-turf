export default async function handler(req, res) {
    const { date } = req.query; // Format attendu: ddmmyyyy

    if (!date) {
        return res.status(400).json({ error: "Date manquante" });
    }

    try {
        const pmuApiUrl = `https://online.turf.pmu.fr/client/rest/v1/programme/${date}`;
        
        const response = await fetch(pmuApiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur PMU ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Impossible de joindre le PMU", details: error.message });
    }
}
