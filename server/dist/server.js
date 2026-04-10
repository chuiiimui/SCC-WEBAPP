import express from "express";
import axios from "axios";
import cors from "cors";
import session from "express-session";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
<<<<<<< HEAD
=======
import { storeSearch } from "./utils.js";
>>>>>>> 4f727c7 (...//D//)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
// Configuration from environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
<<<<<<< HEAD
const HOST = process.env.HOST || "0.0.0.0"; // Bind to all interfaces for reverse proxy compatibility
=======
const HOST = process.env.HOST || "0.0.0.0";
>>>>>>> 4f727c7 (...//D//)
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const isProd = process.env.NODE_ENV === "production";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret";
<<<<<<< HEAD
// Trust proxy for Toolforge and other reverse proxy setups
=======
// Environment Validation
function validateEnvironment() {
    if (isProd) {
        if (SESSION_SECRET === "dev-session-secret") {
            console.error("❌ FATAL: SESSION_SECRET must be set to a secure value in production");
            process.exit(1);
        }
        if (!process.env.SESSION_SECRET) {
            console.error("❌ FATAL: SESSION_SECRET environment variable is required in production");
            process.exit(1);
        }
    }
}
validateEnvironment();
>>>>>>> 4f727c7 (...//D//)
app.set("trust proxy", 1);
// --------------------
// Middleware
// --------------------
<<<<<<< HEAD
// Logging middleware - minimal in production
const morganFormat = isProd ? "combined" : "dev";
app.use(morgan(morganFormat));
// CORS - use process.env.CORS_ORIGIN with fallback to hardcoded Toolforge origins
=======
const morganFormat = isProd ? "combined" : "dev";
app.use(morgan(morganFormat));
>>>>>>> 4f727c7 (...//D//)
const allowedOrigins = [
    CORS_ORIGIN,
    "https://sccghana.toolforge.org",
    "http://sccghana.toolforge.org",
    "https://ghanasupremecases.toolforge.org",
    "http://ghanasupremecases.toolforge.org",
];
app.use(cors({
    origin: (origin, callback) => {
<<<<<<< HEAD
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
=======
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error("The CORS policy for this site does not allow access from the specified Origin."));
>>>>>>> 4f727c7 (...//D//)
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
<<<<<<< HEAD
// Session configuration with NODE_ENV-based security settings
=======
>>>>>>> 4f727c7 (...//D//)
app.use(session({
    name: "search_session",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
    },
}));
<<<<<<< HEAD
// Serve frontend static files from the client/dist directory (production only)
=======
>>>>>>> 4f727c7 (...//D//)
if (isProd) {
    const clientDistPath = join(__dirname, "../../client/dist");
    app.use(express.static(clientDistPath, {
        maxAge: "1d",
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
<<<<<<< HEAD
            // Cache static assets longer (js, css, images)
            if (/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/.test(filePath)) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            }
            // Prevent MIME type sniffing
=======
            if (/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/.test(filePath)) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            }
>>>>>>> 4f727c7 (...//D//)
            res.setHeader("X-Content-Type-Options", "nosniff");
        },
    }));
}
<<<<<<< HEAD
// --------------------
// Static docs
// --------------------
=======
>>>>>>> 4f727c7 (...//D//)
const docsPath = join(__dirname, "../docs/html");
app.use("/docs", express.static(docsPath, {
    index: "index.html",
    dotfiles: "deny",
    etag: true,
    lastModified: true,
    maxAge: isProd ? "1d" : "0",
    setHeaders: (res, path) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("X-XSS-Protection", "1; mode=block");
    },
}));
// --------------------
// Country config
// --------------------
const COUNTRY_CONFIG = {
    ghana: { courtId: "Q1513611", countryId: "Q117" },
    nigeria: { courtId: "Q16011598", countryId: "Q1033" },
    kenya: { courtId: "Q7653543", countryId: "Q114" },
    south_africa: { courtId: "Q1360033", countryId: "Q258" },
};
// --------------------
<<<<<<< HEAD
// Health check
// --------------------
app.get("/api/health", (_req, res) => {
=======
// Search Index & Cache
// --------------------
const CASE_INDEX = new Map();
const cacheWithTTL = new Map();
const MAX_CACHE_SIZE = 500;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
// --------------------
// Utility Functions
// --------------------
function buildSparqlQuery(countryId, courtId) {
    return `
    SELECT DISTINCT ?item ?itemLabel ?itemDescription ?date ?legal_citation ?courtLabel ?majority_opinionLabel ?sourceLabel (GROUP_CONCAT(DISTINCT ?judge; SEPARATOR = ", ") AS ?judges) WHERE {
  {
    SELECT DISTINCT * WHERE {
      ?item (wdt:P31/(wdt:P279*)) wd:Q114079647;
        (wdt:P17/(wdt:P279*)) wd:${countryId};
        (wdt:P1001/(wdt:P279*)) wd:${countryId};
        (wdt:P793/(wdt:P279*)) wd:Q7099379;
        wdt:P4884 ?court.
      ?court (wdt:P279*) wd:${courtId}.
    }
    LIMIT 5000
  }
  ?item wdt:P577 ?date;
    wdt:P1031 ?legal_citation;
    wdt:P1433 ?source;
    wdt:P1594 _:b3.
  _:b3 rdfs:label ?judge.
  FILTER((LANG(?judge)) = "en")
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en". }
}
    GROUP BY ?item ?itemLabel ?itemDescription ?date ?legal_citation ?courtLabel ?majority_opinionLabel ?sourceLabel
    ORDER BY (?date)
  `;
}
function mapWikidataResult(item, country) {
    const caseId = item.item?.value.split("/").pop() || "Not Available";
    return {
        caseId,
        title: item.itemLabel?.value || "Not Available",
        description: item.itemDescription?.value || "No description available",
        date: item.date?.value?.split("T")[0] || "Date not recorded",
        citation: item.legal_citation?.value || "Citation unavailable",
        court: item.courtLabel?.value || "Court not specified",
        majorityOpinion: item.majority_opinionLabel?.value || "Majority opinion unavailable",
        sourceLabel: item.sourceLabel?.value || "Source unavailable",
        judges: item.judges?.value || "Judges unavailable",
        articleUrl: item.item?.value || "",
        country: country.charAt(0).toUpperCase() + country.slice(1).replace(/_/g, " "),
    };
}
function normalize(val) {
    return (val || "").trim().toLowerCase();
}
function tokenize(text) {
    return text
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => token.length > 0);
}
function getCacheEntry(key) {
    const entry = cacheWithTTL.get(key);
    if (!entry)
        return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cacheWithTTL.delete(key);
        return null;
    }
    return entry.data;
}
function setCacheEntry(key, data) {
    if (cacheWithTTL.size >= MAX_CACHE_SIZE) {
        const firstKey = cacheWithTTL.keys().next().value;
        if (firstKey)
            cacheWithTTL.delete(firstKey);
    }
    cacheWithTTL.set(key, { data, timestamp: Date.now() });
}
function calculateScore(caseItem, params) {
    let score = 0;
    const keyword = normalize(params.keyword);
    if (!keyword)
        return 1;
    // Title match (highest priority)
    if (caseItem.title.toLowerCase().includes(keyword))
        score += 10;
    // Description match
    if (caseItem.description.toLowerCase().includes(keyword))
        score += 5;
    // Citation match
    if (caseItem.citation.toLowerCase().includes(keyword))
        score += 7;
    // Judges match
    if (caseItem.judges.toLowerCase().includes(keyword))
        score += 4;
    // Court match
    if (caseItem.court.toLowerCase().includes(keyword))
        score += 3;
    // Tokenized matching (multiple words)
    const titleTokens = tokenize(caseItem.title);
    const keywords = tokenize(keyword);
    const matchingTokens = keywords.filter((k) => titleTokens.some((t) => t.includes(k)));
    score += matchingTokens.length * 2;
    return Math.max(score, 0);
}
async function buildIndex(country) {
    const countryConfig = COUNTRY_CONFIG[country];
    if (!countryConfig)
        return;
    console.log(`📦 Building search index for ${country}...`);
    try {
        const sparqlQuery = buildSparqlQuery(countryConfig.countryId, countryConfig.courtId);
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
        const response = await axios.get(url, {
            timeout: 30000,
            headers: { "User-Agent": "SCC-WEBAPP/1.0 (https://github.com/e-jigsaw/scc-webapp)" },
        });
        const bindings = response?.data?.results?.bindings;
        if (!Array.isArray(bindings)) {
            throw new Error("Invalid Wikidata response");
        }
        const cases = bindings.map((item) => mapWikidataResult(item, country));
        CASE_INDEX.set(country, cases);
        console.log(`✅ Indexed ${cases.length} cases for ${country}`);
    }
    catch (error) {
        console.error(`❌ Failed to build index for ${country}:`, error);
    }
}
function searchCases(params, country) {
    const cases = CASE_INDEX.get(country) || [];
    const keyword = normalize(params.keyword);
    const year = params.year ? params.year.trim() : "";
    const judge = normalize(params.judge);
    const caseType = normalize(params.caseType);
    return cases
        .map((c) => ({ ...c, score: calculateScore(c, params) }))
        .filter((c) => {
        let matches = true;
        if (keyword) {
            const keywordTokens = tokenize(keyword);
            matches =
                matches &&
                    keywordTokens.some((token) => [c.title, c.description, c.court, c.citation, c.judges]
                        .map((f) => (f || "").toLowerCase())
                        .some((f) => f.includes(token)));
        }
        if (year) {
            matches = matches && (c.date || "").includes(year);
        }
        if (judge) {
            matches = matches && (c.judges || "").toLowerCase().includes(judge);
        }
        if (caseType) {
            matches = matches && (c.court || "").toLowerCase().includes(caseType);
        }
        return matches && (c.score || 0) > 0;
    })
        .sort((a, b) => (b.score || 0) - (a.score || 0));
}
// --------------------
// Health check
// --------------------
app.get("/api/health", (_req, res) => {
    const indexStatus = Object.fromEntries(Array.from(CASE_INDEX.entries()).map(([country, cases]) => [country, cases.length]));
>>>>>>> 4f727c7 (...//D//)
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
<<<<<<< HEAD
=======
        indexStatus,
        cacheSize: cacheWithTTL.size,
>>>>>>> 4f727c7 (...//D//)
    });
});
// --------------------
// Root
// --------------------
app.get("/", (_req, res) => {
    res.json({
        message: "Supreme Court Cases API",
        version: "1.0.0",
        endpoints: {
            health: `GET ${BASE_URL}/api/health`,
<<<<<<< HEAD
            search_all_cases: `GET ${BASE_URL}/search`,
            search_with_query: `GET ${BASE_URL}/search?q={query}`,
            translations_all: `GET ${BASE_URL}/api/translations`,
            translations_case: `GET ${BASE_URL}/api/translations/{caseId}`,
=======
            countries: `GET ${BASE_URL}/api/countries`,
            search: `GET ${BASE_URL}/search?q={query}&country={countryCode}`,
            filter: `GET ${BASE_URL}/filter?keyword={query}&year={year}&judge={judge}&type={caseType}&country={code}&page={page}&limit={limit}`,
            recent_searches: `GET ${BASE_URL}/api/recent-searches`,
            translations: `GET ${BASE_URL}/api/translations`,
>>>>>>> 4f727c7 (...//D//)
        },
    });
});
// --------------------
// Countries
// --------------------
app.get("/api/countries", (_req, res) => {
    const countries = Object.keys(COUNTRY_CONFIG).map((key) => ({
        code: key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        wikidataId: COUNTRY_CONFIG[key].countryId,
    }));
    res.json({ success: true, totalCountries: countries.length, countries });
});
<<<<<<< HEAD
app.get("/search", async (req, res) => {
    const userQuery = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const countryParam = typeof req.query.country === "string" ? req.query.country.trim().toLowerCase() : "ghana";
    const countryConfig = COUNTRY_CONFIG[countryParam];
    if (!countryConfig)
        return res.status(400).json({ success: false, error: `Unsupported country: ${countryParam}` });
    const { countryId, courtId } = countryConfig;
    const sparqlQuery = `
    SELECT DISTINCT ?item ?itemLabel ?itemDescription ?date ?legal_citation ?courtLabel ?majority_opinionLabel ?sourceLabel (GROUP_CONCAT(DISTINCT ?judge; SEPARATOR = ", ") AS ?judges) WHERE {
  {
    SELECT DISTINCT * WHERE {
      ?item (wdt:P31/(wdt:P279*)) wd:Q114079647;
        (wdt:P17/(wdt:P279*)) wd:Q117;
        (wdt:P1001/(wdt:P279*)) wd:Q117;
        (wdt:P793/(wdt:P279*)) wd:Q7099379;
        wdt:P4884 ?court.
      ?court (wdt:P279*) wd:Q1513611.
    }
    LIMIT 5000
  }
  ?item wdt:P577 ?date;
    wdt:P1031 ?legal_citation;
    wdt:P1433 ?source;
    wdt:P1594 _:b3.
  _:b3 rdfs:label ?judge.
  FILTER((LANG(?judge)) = "en")
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en". }
}
GROUP BY ?item ?itemLabel ?itemDescription ?date ?legal_citation ?courtLabel ?majority_opinionLabel ?sourceLabel
ORDER BY (?date)
  `;
    try {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
        const { data } = await axios.get(url, { timeout: 10000 });
        const cases = data.results.bindings.map((item) => ({
            caseId: item.item?.value.split("/").pop() || "Not Available",
            title: item.itemLabel?.value || "Not Available",
            description: item.itemDescription?.value || "No description available",
            date: item.date?.value?.split("T")[0] || "Date not recorded",
            citation: item.legal_citation?.value || "Citation unavailable",
            court: item.courtLabel?.value || "Court not specified",
            majorityOpinion: item.majority_opinionLabel?.value || "Majority opinion unavailable",
            sourceLabel: item.sourceLabel?.value || "Source unavailable",
            judges: item.judges?.value || "Judges unavailable",
            articleUrl: item.item?.value || "",
            country: countryParam.charAt(0).toUpperCase() + countryParam.slice(1).replace(/_/g, " "),
        })).filter((c) => !userQuery || [c.title, c.description, c.court, c.citation, c.judges].some(f => f.toLowerCase().includes(userQuery)));
        res.json({ success: true, results: cases, totalResults: cases.length });
=======
// --------------------
// Search (Legacy - hits Wikidata)
// --------------------
app.get("/search", async (req, res) => {
    const userQuery = normalize(req.query.q);
    const countryParam = normalize(req.query.country) || "ghana";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const countryConfig = COUNTRY_CONFIG[countryParam];
    if (!countryConfig)
        return res.status(400).json({ success: false, error: `Unsupported country: ${countryParam}` });
    if (userQuery) {
        storeSearch(req, userQuery);
    }
    const { countryId, courtId } = countryConfig;
    const sparqlQuery = buildSparqlQuery(countryId, courtId);
    try {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
        const { data } = await axios.get(url, {
            timeout: 15000,
            headers: { "User-Agent": "SCC-WEBAPP/1.0 (https://github.com/e-jigsaw/scc-webapp)" },
        });
        const allCases = data.results.bindings
            .map((item) => mapWikidataResult(item, countryParam))
            .filter((c) => !userQuery ||
            [c.title, c.description, c.court, c.citation, c.judges].some((f) => (f || "").toLowerCase().includes(userQuery)));
        // Pagination
        const start = (page - 1) * limit;
        const paginatedResults = allCases.slice(start, start + limit);
        res.json({
            success: true,
            results: paginatedResults,
            totalResults: allCases.length,
            page,
            limit,
            totalPages: Math.ceil(allCases.length / limit),
        });
>>>>>>> 4f727c7 (...//D//)
    }
    catch (error) {
        console.error("❌ Search API Error:", error);
        res.status(500).json({ success: false, error: "Search request failed." });
    }
});
// --------------------
<<<<<<< HEAD
// Translations
// --------------------
app.get("/api/translations", async (req, res) => {
    const countryParam = typeof req.query.country === "string" ? req.query.country.trim().toLowerCase() : "ghana";
    await handleTranslations(undefined, countryParam, res);
});
app.get("/api/translations/:caseId", async (req, res) => {
    const countryParam = typeof req.query.country === "string" ? req.query.country.trim().toLowerCase() : "ghana";
=======
// Filter (Search Engine - uses Index)
// --------------------
app.get("/filter", (req, res) => {
    const keyword = req.query.keyword;
    const year = req.query.year;
    const judge = req.query.judge;
    const caseType = req.query.type;
    const countryParam = normalize(req.query.country) || "ghana";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const countryConfig = COUNTRY_CONFIG[countryParam];
    if (!countryConfig)
        return res.status(400).json({ success: false, error: `Unsupported country: ${countryParam}` });
    // Check cache
    const cacheKey = JSON.stringify({ keyword, year, judge, caseType, country: countryParam });
    let cached = getCacheEntry(cacheKey);
    let results = cached;
    if (!results) {
        // Search from index
        results = searchCases({ keyword, year, judge, caseType }, countryParam);
        setCacheEntry(cacheKey, results);
    }
    else {
        console.log("⚡ CACHE HIT for:", keyword);
    }
    // Pagination
    const start = (page - 1) * limit;
    const paginatedResults = results.slice(start, start + limit);
    // Track search
    if (keyword) {
        storeSearch(req, keyword);
    }
    res.json({
        success: true,
        results: paginatedResults,
        totalResults: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit),
    });
});
// --------------------
// Recent Searches
// --------------------
app.get("/api/recent-searches", (req, res) => {
    const searches = req.session.recentSearches || [];
    res.json({ success: true, searches, totalSearches: searches.length });
});
// --------------------
// Translations
// --------------------
app.get("/api/translations", async (req, res) => {
    const countryParam = normalize(req.query.country) || "ghana";
    await handleTranslations(undefined, countryParam, res);
});
app.get("/api/translations/:caseId", async (req, res) => {
    const countryParam = normalize(req.query.country) || "ghana";
>>>>>>> 4f727c7 (...//D//)
    await handleTranslations(req.params.caseId, countryParam, res);
});
async function handleTranslations(caseId, country, res) {
    const countryConfig = COUNTRY_CONFIG[country];
    if (!countryConfig)
        return res.status(400).json({ success: false, error: `Unsupported country: ${country}` });
    const { countryId, courtId } = countryConfig;
    try {
<<<<<<< HEAD
        const baseQuery = `SELECT DISTINCT ?item ?itemLabel ?itemDescription ?date ?legal_citation ?courtLabel ?majority_opinionLabel ?sourceLabel (GROUP_CONCAT(DISTINCT ?judge; SEPARATOR = ", ") AS ?judges) WHERE {
  {
    SELECT DISTINCT * WHERE {
      ?item (wdt:P31/(wdt:P279*)) wd:Q114079647;
        (wdt:P17/(wdt:P279*)) wd:Q117;
        (wdt:P1001/(wdt:P279*)) wd:Q117;
        (wdt:P793/(wdt:P279*)) wd:Q7099379;
        wdt:P4884 ?court.
      ?court (wdt:P279*) wd:Q1513611.
    }
    LIMIT 5000
  }
  ?item wdt:P577 ?date;
    wdt:P1031 ?legal_citation;
    wdt:P1433 ?source;
    wdt:P1594 _:b3.
  _:b3 rdfs:label ?judge.
  FILTER((LANG(?judge)) = "en")
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en". }
}
GROUP BY ?item ?itemLabel ?itemDescription ?date ?legal_citation ?courtLabel ?majority_opinionLabel ?sourceLabel
ORDER BY (?date)
    `;
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(baseQuery)}&format=json`;
        const { data } = await axios.get(url, { timeout: 20000 });
=======
        const baseQuery = buildSparqlQuery(countryId, courtId);
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(baseQuery)}&format=json`;
        const { data } = await axios.get(url, {
            timeout: 15000,
            headers: { "User-Agent": "SCC-WEBAPP/1.0 (https://github.com/e-jigsaw/scc-webapp)" },
        });
>>>>>>> 4f727c7 (...//D//)
        const bindings = data.results.bindings;
        if (caseId && bindings.length === 0)
            return res.status(404).json({ success: false, error: `Case not found: ${caseId}` });
        const translationsMap = new Map();
        bindings.forEach((item) => {
            const cId = item.item?.value.split("/").pop() || "Unknown";
            const caseTitle = item.itemLabel?.value || "Unknown Case";
<<<<<<< HEAD
            const langCode = item.language?.value?.split("/").pop() || "en";
            const langLabel = item.languageLabel?.value || "English";
            if (!translationsMap.has(cId))
                translationsMap.set(cId, { caseId: cId, caseTitle, availableLanguages: [] });
            const caseData = translationsMap.get(cId);
            if (!caseData.availableLanguages.find((l) => l.languageCode === langCode)) {
                caseData.availableLanguages.push({
                    languageCode: langCode,
                    languageLabel: langLabel,
                    wikidataUrl: item.item?.value,
                    source: "Wikidata",
                });
            }
        });
        translationsMap.forEach((caseData) => {
=======
            if (!translationsMap.has(cId))
                translationsMap.set(cId, { caseId: cId, caseTitle, availableLanguages: [] });
            const caseData = translationsMap.get(cId);
>>>>>>> 4f727c7 (...//D//)
            if (caseData.availableLanguages.length === 0) {
                caseData.availableLanguages.push({
                    languageCode: "en",
                    languageLabel: "English",
<<<<<<< HEAD
                    wikidataUrl: `https://www.wikidata.org/entity/${caseData.caseId}`,
                    source: "Wikidata (Default)",
                });
            }
        });
        res.json({ success: true, totalCases: translationsMap.size, results: Array.from(translationsMap.values()) });
=======
                    wikidataUrl: item.item?.value || `https://www.wikidata.org/entity/${cId}`,
                    source: "Wikidata",
                });
            }
        });
        res.json({
            success: true,
            totalCases: translationsMap.size,
            results: Array.from(translationsMap.values()),
        });
>>>>>>> 4f727c7 (...//D//)
    }
    catch (error) {
        console.error("❌ Translation API Error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch translation data." });
    }
}
<<<<<<< HEAD
// Catch-all route for frontend SPA routing (production only)
// This ensures all non-API routes return index.html for client-side routing
if (isProd) {
    const clientDistPath = join(__dirname, "../../client/dist");
    app.get(/^(?!\/api\/).*/, (_req, res) => {
=======
// SPA routing
if (isProd) {
    const clientDistPath = join(__dirname, "../../client/dist");
    app.get(/^(?!\/api\/)(?!\/docs\/).*/, (_req, res) => {
>>>>>>> 4f727c7 (...//D//)
        const indexPath = join(clientDistPath, "index.html");
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error("Error serving index.html:", err);
                res.status(500).json({ success: false, error: "Failed to load application" });
            }
        });
    });
}
// --------------------
<<<<<<< HEAD
// Start server
// --------------------
app.listen(PORT, HOST, () => {
    if (!isProd) {
        console.log(`Server running on ${HOST}:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`CORS Origin: ${CORS_ORIGIN}`);
        console.log(`Base URL: ${BASE_URL}`);
    }
});
=======
// Start server & Build Index
// --------------------
const server = app.listen(PORT, HOST, async () => {
    console.log(`\n🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`CORS Origin: ${CORS_ORIGIN}\n`);
    // Build indexes for all countries
    for (const country of Object.keys(COUNTRY_CONFIG)) {
        await buildIndex(country);
    }
    console.log("✅ Server ready for requests\n");
});
export default server;
>>>>>>> 4f727c7 (...//D//)
