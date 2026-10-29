export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { date } = req.query; // Format attendu : ddmmyyyy

    if (!date) {
        return res.status(400).json({ error: "Date manquante" });
    }

    // Simulation parfaite d'un iPhone se connectant au PMU
    const headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9",
        "Referer": "https://www.pmu.fr/",
        "Origin": "https://www.pmu.fr"
    };

    try {
        // Source 1 : API Mobile PMU
        let response = await fetch(`https://online.turf.pmu.fr/client/rest/v1/programme/${date}`, { headers });
        
        // Source 2 : Miroir secondaire en cas de restriction
        if (!response.ok) {
            response = await fetch(`https://turfinfo.api.pmu.fr/rest/v1/programme/${date}`, { headers });
        }

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Accès refusé par le PMU (Erreur ${response.status})` 
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ 
            error: "Erreur de liaison réseau avec le PMU", 
            details: error.message 
        });
    }
}
