module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/instagram.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getInstagramPosts",
    ()=>getInstagramPosts,
    "getMediaInsights",
    ()=>getMediaInsights,
    "getPostWithInsights",
    ()=>getPostWithInsights
]);
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID = process.env.INSTAGRAM_USER_ID;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const getInstagramPosts = async ()=>{
    if (!ACCESS_TOKEN || !USER_ID) {
        console.error('❌ API Key missing');
        return [];
    }
    const fields = 'id,caption,media_type,timestamp,like_count,comments_count,permalink';
    const url = `${BASE_URL}/${USER_ID}/media?fields=${fields}&access_token=${ACCESS_TOKEN}&limit=20`;
    console.log('Fetching URL:', url);
    try {
        const res = await fetch(url, {
            cache: 'no-store'
        });
        if (!res.ok) {
            const errorData = await res.json();
            console.error('❌ Instagram API Error:', errorData);
            return [];
        }
        const data = await res.json();
        console.log('✅ Posts fetched:', data.data?.length || 0);
        return data.data || [];
    } catch (error) {
        console.error('❌ Fetch Error:', error);
        return [];
    }
};
async function getMediaInsights(mediaId) {
    if (!ACCESS_TOKEN) return null;
    const metrics = 'views,reach,saved';
    const url = `${BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${ACCESS_TOKEN}`;
    try {
        const res = await fetch(url, {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        const json = await res.json();
        const data = json.data;
        const results = {};
        if (Array.isArray(data)) {
            for (const item of data){
                if (item.values && item.values.length > 0) {
                    results[item.name] = item.values[0].value;
                }
            }
        }
        return {
            views: results['views'] || 0,
            reach: results['reach'] || 0,
            saved: results['saved'] || 0
        };
    } catch (error) {
        return null;
    }
}
const getPostWithInsights = async (mediaId)=>{
    if (!ACCESS_TOKEN) return null;
    const fields = 'id,caption,media_type,timestamp,like_count,comments_count,permalink';
    const url = `${BASE_URL}/${mediaId}?fields=${fields}&access_token=${ACCESS_TOKEN}`;
    try {
        const res = await fetch(url, {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        const post = await res.json();
        const insights = await getMediaInsights(mediaId);
        return {
            ...post,
            insights: insights || {
                views: 0,
                reach: 0,
                saved: 0
            }
        };
    } catch (error) {
        return null;
    }
};
}),
"[project]/app/api/instagram/fetch-posts/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$instagram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/instagram.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('media_id');
    try {
        if (mediaId) {
            const post = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$instagram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPostWithInsights"])(mediaId);
            if (!post) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Post not found or API error'
                }, {
                    status: 404
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(post);
        }
        const posts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$instagram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getInstagramPosts"])();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(posts);
    } catch (error) {
        console.error('API Route Error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal Server Error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ae340449._.js.map