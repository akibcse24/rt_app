module.exports=[14747,(e,t,a)=>{t.exports=e.x("path",()=>require("path"))},24361,(e,t,a)=>{t.exports=e.x("util",()=>require("util"))},70406,(e,t,a)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,a)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},54799,(e,t,a)=>{t.exports=e.x("crypto",()=>require("crypto"))},22734,(e,t,a)=>{t.exports=e.x("fs",()=>require("fs"))},27699,(e,t,a)=>{t.exports=e.x("events",()=>require("events"))},5365,(e,t,a)=>{t.exports=e.x("process",()=>require("process"))},21517,(e,t,a)=>{t.exports=e.x("http",()=>require("http"))},92509,(e,t,a)=>{t.exports=e.x("url",()=>require("url"))},88947,(e,t,a)=>{t.exports=e.x("stream",()=>require("stream"))},6461,(e,t,a)=>{t.exports=e.x("zlib",()=>require("zlib"))},46786,(e,t,a)=>{t.exports=e.x("os",()=>require("os"))},4446,(e,t,a)=>{t.exports=e.x("net",()=>require("net"))},55004,(e,t,a)=>{t.exports=e.x("tls",()=>require("tls"))},93695,(e,t,a)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},50377,e=>{"use strict";let t=[];function a(e,a,r,n){let s={timestamp:new Date().toISOString(),level:e,message:a,error:r,context:n,stack:r instanceof Error?r.stack:void 0};t.push(s),t.length>100&&t.shift();let i=`[${s.timestamp}] [${e.toUpperCase()}]`;console.log(`${i} ${a}`,n?JSON.stringify(n):""),r&&console.error(r)}e.s(["logger",0,{debug:(e,t)=>a("debug",e,void 0,t),info:(e,t)=>a("info",e,void 0,t),warn:(e,t,r)=>a("warn",e,t,r),error:(e,t,r)=>a("error",e,t,r),critical:(e,t,r)=>a("critical",e,t,r),firestoreError:(e,t,r,n)=>{a("error",`Firestore ${e} failed`,t,{userId:r,action:e,component:"Firestore",metadata:{documentId:n}})},apiError:(e,t,r,n)=>{a("error",`API ${t} ${e} failed`,r,{action:`${t} ${e}`,component:"API",metadata:{statusCode:n}})},getRecentLogs:(e=20)=>t.slice(-e),clearLogs:()=>{t.length=0}}])},79678,e=>{"use strict";var t=e.i(89171);let a=new Map,r={auth:{windowMs:6e4,maxRequests:5,message:"Too many authentication attempts. Please try again in a minute.",keyPrefix:"rl_auth_"},ai:{windowMs:6e4,maxRequests:20,message:"AI request limit reached. Please try again in a minute.",keyPrefix:"rl_ai_"},default:{windowMs:6e4,maxRequests:100,message:"Too many requests. Please try again later.",keyPrefix:"rl_"},leaderboard:{windowMs:6e4,maxRequests:30,message:"Leaderboard request limit reached. Please try again later.",keyPrefix:"rl_leaderboard_"}},n={windowMs:6e4,maxRequests:60,message:"Too many requests. Please try again later.",keyPrefix:"rl_"};function s(e,t={}){let r,i,o,{windowMs:l,maxRequests:d,keyPrefix:c}={...n,...t},u=(r=e.headers.get("x-forwarded-for"),i=e.headers.get("x-real-ip"),o=e.headers.get("cf-connecting-ip"),r?.split(",")[0]||i||o||"anonymous"),p=c||n.keyPrefix,m=`${p}${u}`,h=Date.now();.01>Math.random()&&function(){let e=Date.now();for(let[t,r]of a.entries())e>r.resetTime&&a.delete(t)}();let g=a.get(m);return!g||h>g.resetTime?(a.set(m,{count:1,resetTime:h+l}),{allowed:!0,remaining:d-1,resetTime:h+l,limit:d}):g.count>=d?{allowed:!1,remaining:0,resetTime:g.resetTime,limit:d}:(g.count++,{allowed:!0,remaining:d-g.count,resetTime:g.resetTime,limit:d})}function i(e,a={}){let r=s(e,a),{message:o}={...n,...a};if(!r.allowed){let e=Math.ceil((r.resetTime-Date.now())/1e3);return t.NextResponse.json({error:"Too Many Requests",message:o,retryAfter:e},{status:429,headers:{"Retry-After":e.toString(),"X-RateLimit-Limit":String(r.limit),"X-RateLimit-Remaining":"0","X-RateLimit-Reset":String(Math.ceil(r.resetTime/1e3))}})}let l=t.NextResponse.next();return l.headers.set("X-RateLimit-Limit",String(r.limit)),l.headers.set("X-RateLimit-Remaining",String(r.remaining)),l.headers.set("X-RateLimit-Reset",String(Math.ceil(r.resetTime/1e3))),l}e.s(["RATE_LIMIT_PRESETS",()=>r,"checkRateLimit",()=>s,"withRateLimit",()=>i])},874,(e,t,a)=>{t.exports=e.x("buffer",()=>require("buffer"))},24836,(e,t,a)=>{t.exports=e.x("https",()=>require("https"))},81111,(e,t,a)=>{t.exports=e.x("node:stream",()=>require("node:stream"))},73638,e=>{"use strict";function t(e){return"string"!=typeof e?"":e.replace(/[<>]/g,"").replace(/\0/g,"").trim()}e.s(["sanitizePlainText",()=>t])},23316,e=>{"use strict";var t=e.i(47909),a=e.i(74017),r=e.i(96250),n=e.i(59756),s=e.i(61916),i=e.i(74677),o=e.i(69741),l=e.i(16795),d=e.i(87718),c=e.i(95169),u=e.i(47587),p=e.i(66012),m=e.i(70101),h=e.i(26937),g=e.i(10372),f=e.i(93695);e.i(52474);var x=e.i(220),y=e.i(34731),T=e.i(89171),R=e.i(79678),E=e.i(73638),v=e.i(50377);let w=`You are "Routine AI", a smart, friendly productivity assistant for a routine tracking app. You have these capabilities:

## CORE ACTIONS (respond with JSON blocks):

### 1. CREATE TASK (Recurring or Date-Specific)

**For RECURRING tasks** (e.g., "every Monday", "twice a week"):
\`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Task name", "icon": "emoji", "startTime": "HH:MM", "endTime": "HH:MM", "timeBlock": "Dawn|Morning|Noon|Afternoon|Evening|Night", "days": ["MON","TUE","WED","THU","FRI","SAT","SUN"]}}
\`\`\`

**For DATE-SPECIFIC tasks** (e.g., "on January 15th", "next Monday", "tomorrow"):
\`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Task name", "icon": "emoji", "startTime": "HH:MM", "endTime": "HH:MM", "timeBlock": "Dawn|Morning|Noon|Afternoon|Evening|Night", "specificDate": "YYYY-MM-DD", "days": []}}
\`\`\`

### 2. CREATE GOAL  
\`\`\`json
{"action": "CREATE_GOAL", "goal": {"title": "Goal name", "description": "Description", "targetDate": "YYYY-MM-DD", "category": "Fitness|Health|Career|Personal|Education"}}
\`\`\`

### 3. COMPLETE TASK
\`\`\`json
{"action": "COMPLETE_TASK", "taskId": "the-task-id", "taskTitle": "Task name"}
\`\`\`

### 4. DELETE TASK (by ID or by date)
\`\`\`json
{"action": "DELETE_TASK", "taskId": "the-task-id", "taskTitle": "Task name"}
\`\`\`

### 5. EDIT TASK (change time, title, days, or date)

**To change to a specific date** (e.g., "move to January 20th"):
\`\`\`json
{"action": "EDIT_TASK", "taskId": "the-task-id", "updates": {"specificDate": "YYYY-MM-DD", "days": []}}
\`\`\`

**To change time or other properties**:
\`\`\`json
{"action": "EDIT_TASK", "taskId": "the-task-id", "updates": {"title": "New title", "startTime": "HH:MM", "endTime": "HH:MM"}}
\`\`\`

**To convert from date-specific to recurring**:
\`\`\`json
{"action": "EDIT_TASK", "taskId": "the-task-id", "updates": {"days": ["MON","WED","FRI"], "specificDate": null}}
\`\`\`

## DATE PARSING INTELLIGENCE:

When users mention dates, intelligently parse them:
- **Absolute dates**: "January 15th 2026", "1/15/2026", "Jan 15" → "2026-01-15"
- **Relative dates**: "tomorrow", "next Monday", "this Friday" → calculate and use "YYYY-MM-DD"
- **Today's date is provided in context** - use it as reference for all date calculations
- **Time expressions**: "morning" → 09:00, "afternoon" → 14:00, "evening" → 18:00

**IMPORTANT DATE RULES**:
1. **Always use YYYY-MM-DD format** for specificDate in JSON
2. **When user says "Monday"** without qualifier:
   - If it's unclear, ask: "Do you mean next Monday (specific date) or every Monday (recurring)?"
   - If context suggests one-time event (e.g., "dentist", "appointment"), default to next Monday (date-specific)
   - If context suggests routine (e.g., "workout", "meditation"), ask for clarification
3. **Validate dates**: Don't create tasks in the past (warn user first)
4. **Date-specific tasks use empty days array**: \`"days": []\` when specificDate is set

## SMART FEATURES:

1. **Conflict Detection**: If user adds a task that overlaps with existing tasks, warn them!
2. **Smart Suggestions**: Proactively suggest tasks based on their goals and patterns
3. **Streak Encouragement**: Celebrate streaks and milestones (1 week, 1 month, etc.)
4. **Natural Scheduling**: Understand "every weekday", "twice a week", "mornings", etc.
5. **Calendar Intelligence**: Recognize one-time events vs recurring routines
6. **Multi-language**: Respond in the same language the user writes in

## EXAMPLES:

**User**: "Create a dentist appointment on January 15th at 2pm"
**You**: \`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Dentist Appointment", "icon": "🦷", "startTime": "14:00", "endTime": "15:00", "timeBlock": "Afternoon", "specificDate": "2026-01-15", "days": []}}
\`\`\`
*Response*: "Got it! I've scheduled your dentist appointment for January 15th, 2026 at 2:00 PM. 🦷"

**User**: "Add workout every Monday morning"
**You**: \`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Workout", "icon": "💪", "startTime": "07:00", "endTime": "08:00", "timeBlock": "Morning", "days": ["MON"]}}
\`\`\`
*Response*: "Perfect! I've added a weekly workout routine for Monday mornings at 7:00 AM. 💪"

**User**: "Move my meeting to January 20th"
**You**: First find the task ID, then: \`\`\`json
{"action": "EDIT_TASK", "taskId": "task-id-here", "updates": {"specificDate": "2026-01-20", "days": []}}
\`\`\`
*Response*: "Done! I've rescheduled your meeting to January 20th, 2026. 📅"

## PERSONALITY:
- Be warm, encouraging, and concise
- Use emojis sparingly but effectively 🎯
- Celebrate wins and be supportive during setbacks
- Give specific, actionable advice
- Remember context from the current conversation

## IMPORTANT:
- Only include ONE JSON block per response if an action is needed
- Always confirm what you did after an action
- If unsure which task the user means, ask for clarification
- For time conflicts, show both tasks and ask how to proceed
- When creating date-specific tasks, ALWAYS include specificDate in YYYY-MM-DD format`;async function k(e){let t=(0,R.withRateLimit)(e,{maxRequests:20,windowMs:6e4,message:"Too many chat requests. Please wait a moment."});if(t)return v.logger.warn("Rate limit exceeded for AI chat",void 0,{action:"POST /api/ai/chat"}),t;try{let t=await e.json(),a=(0,E.sanitizePlainText)(t.message),r=t.context,n=t.conversationHistory,s=t.currentDate;if(!a)return T.NextResponse.json({error:"Message is required"},{status:400});let i=(()=>{let e=process.env.GEMINI_API_KEY;if(!e)throw Error("GEMINI_API_KEY is not set in environment variables");return new y.GoogleGenAI({apiKey:e})})(),o=w;if(s&&(o+=`

## CURRENT DATE:
Today is ${s}. Use this as the reference for "today", "now", and any date-related queries.`),r?.tasks?.length){let e=r.tasks.map(e=>{let t=e.isCompleted?"✅":"⬜";return`- ${t} [ID: ${e.id}] "${(0,E.sanitizePlainText)(e.title)}" (${e.startTime}-${e.endTime}, ${e.days?.join(",")||"daily"})${e.streak?` 🔥${e.streak}`:""}`}).join("\n");o+=`

## USER'S TASKS:
${e}`}if(r?.goals?.length){let e=r.goals.map(e=>`- "${(0,E.sanitizePlainText)(e.title)}" (${e.category||"Personal"})`).join("\n");o+=`

## USER'S GOALS:
${e}`}let l=[{role:"user",parts:[{text:o}]},{role:"model",parts:[{text:"I understand! I'm Routine AI with full task management capabilities. I can create, edit, delete, and complete tasks, set goals, detect conflicts, and keep you motivated. How can I help you today?"}]}];if(n?.length)for(let e of n.slice(-10))l.push({role:"user"===e.role?"user":"model",parts:[{text:(0,E.sanitizePlainText)(e.content)}]});l.push({role:"user",parts:[{text:a}]});let d=(await i.models.generateContent({model:"gemini-3-flash-preview",contents:l})).text||"",c=null,u=d.match(/```json\n([\s\S]*?)\n```/);if(u)try{c=JSON.parse(u[1])}catch(e){}return v.logger.info("AI chat response generated",{action:"POST /api/ai/chat"}),T.NextResponse.json({message:d,action:c})}catch(e){return v.logger.apiError("/api/ai/chat","POST",e,500),T.NextResponse.json({error:e.message||"Failed to generate response"},{status:500})}}e.s(["POST",()=>k],74441);var A=e.i(74441);let M=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/ai/chat/route",pathname:"/api/ai/chat",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/ai/chat/route.ts",nextConfigOutput:"",userland:A}),{workAsyncStorage:S,workUnitAsyncStorage:I,serverHooks:D}=M;function P(){return(0,r.patchFetch)({workAsyncStorage:S,workUnitAsyncStorage:I})}async function _(e,t,r){M.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let y="/api/ai/chat/route";y=y.replace(/\/index$/,"")||"/";let T=await M.prepare(e,t,{srcPage:y,multiZoneDraftMode:!1});if(!T)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:R,params:E,nextConfig:v,parsedUrl:w,isDraftMode:k,prerenderManifest:A,routerServerContext:S,isOnDemandRevalidate:I,revalidateOnlyGenerated:D,resolvedPathname:P,clientReferenceManifest:_,serverActionsManifest:C}=T,N=(0,o.normalizeAppPath)(y),b=!!(A.dynamicRoutes[N]||A.routes[P]),q=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,w,!1):t.end("This page could not be found"),null);if(b&&!k){let e=!!A.routes[P],t=A.dynamicRoutes[N];if(t&&!1===t.fallback&&!e){if(v.experimental.adapterPath)return await q();throw new f.NoFallbackError}}let O=null;!b||M.isDev||k||(O="/index"===(O=P)?"/":O);let j=!0===M.isDev||!b,H=b&&!j;C&&_&&(0,i.setManifestsSingleton)({page:y,clientReferenceManifest:_,serverActionsManifest:C});let L=e.method||"GET",Y=(0,s.getTracer)(),$=Y.getActiveScopeSpan(),U={params:E,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!v.experimental.authInterrupts},cacheComponents:!!v.cacheComponents,supportsDynamicResponse:j,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:v.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,r,n)=>M.onRequestError(e,t,r,n,S)},sharedContext:{buildId:R}},K=new l.NodeNextRequest(e),F=new l.NodeNextResponse(t),G=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let i=async e=>M.handle(G,U).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=Y.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=a.get("next.route");if(r){let t=`${L} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t)}else e.updateName(`${L} ${y}`)}),o=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var s,l;let d=async({previousCacheEntry:a})=>{try{if(!o&&I&&D&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await i(n);e.fetchMetrics=U.renderOpts.fetchMetrics;let l=U.renderOpts.pendingWaitUntil;l&&r.waitUntil&&(r.waitUntil(l),l=void 0);let d=U.renderOpts.collectedTags;if(!b)return await (0,p.sendResponse)(K,F,s,U.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(s.headers);d&&(t[g.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,r=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:x.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:r}}}}catch(t){throw(null==a?void 0:a.isStale)&&await M.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:I})},!1,S),t}},c=await M.handleResponse({req:e,nextConfig:v,cacheKey:O,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:I,revalidateOnlyGenerated:D,responseGenerator:d,waitUntil:r.waitUntil,isMinimalMode:o});if(!b)return null;if((null==c||null==(s=c.value)?void 0:s.kind)!==x.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",I?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),k&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,m.fromNodeOutgoingHttpHeaders)(c.value.headers);return o&&b||f.delete(g.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,h.getCacheControlHeader)(c.cacheControl)),await (0,p.sendResponse)(K,F,new Response(c.value.body,{headers:f,status:c.value.status||200})),null};$?await l($):await Y.withPropagatedContext(e.headers,()=>Y.trace(c.BaseServerSpan.handleRequest,{spanName:`${L} ${y}`,kind:s.SpanKind.SERVER,attributes:{"http.method":L,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await M.onRequestError(e,t,{routerKind:"App Router",routePath:N,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:I})},!1,S),b)throw t;return await (0,p.sendResponse)(K,F,new Response(null,{status:500})),null}}e.s(["handler",()=>_,"patchFetch",()=>P,"routeModule",()=>M,"serverHooks",()=>D,"workAsyncStorage",()=>S,"workUnitAsyncStorage",()=>I],23316)},85685,e=>{e.v(e=>Promise.resolve().then(()=>e(54799)))},91961,e=>{e.v(t=>Promise.all(["server/chunks/node_modules_ms_index_ee15d80f.js","server/chunks/[root-of-the-server]__98a8faea._.js"].map(t=>e.l(t))).then(()=>t(12111)))},72331,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__7a75eb06._.js","server/chunks/[root-of-the-server]__04a33fa5._.js","server/chunks/[root-of-the-server]__5ddcde7c._.js"].map(t=>e.l(t))).then(()=>t(20442)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__577edbb6._.js.map