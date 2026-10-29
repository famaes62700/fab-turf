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

    // Fonction fetch sécurisée avec secours via AllOrigins
    async function fetchWithFallback(targetUrl) {
        try {
            const response = await fetch(targetUrl, { headers });
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {}

        // Si le blocage direct échoue, on passe par un proxy public transparent
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const data = await response.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
            }
        } catch (e) {}

        return null;
    }

    // Cas 1 : Partants et rapports d'une course spécifique
    if (r && c) {
        const participantsUrl = `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}/R${r}/C${c}/participants`;
        const participantsData = await fetchWithFallback(participantsUrl);

        let rapportsData = null;
        try {
            const rapportsUrl = `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}/R${r}/C${c}/rapports-definitifs`;
            rapportsData = await fetchWithFallback(rapportsUrl);
        } catch (e) {}

        return res.status(200).json({
            participants: participantsData ? (participantsData.participants || participantsData) : [],
            rapports: rapportsData
        });
    }

    // Cas 2 : Programme global des réunions du jour
    const programmeUrl = `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${date}?specialisation=INTERNET`;
    const data = await fetchWithFallback(programmeUrl);

    if (data) {
        return res.status(200).json(data.programme ? data : { programme: data });
    }

    // Ultime tentative sur l'autre client officiel
    const fallbackUrl = `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${date}`;
    const fallbackData = await fetchWithFallback(fallbackUrl);

    if (fallbackData) {
        return res.status(200).json(fallbackData.programme ? fallbackData : { programme: fallbackData });
    }

    return res.status(500).json({ error: "Impossible de récupérer le programme officiel PMU pour cette date." });
}
