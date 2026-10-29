// اختبارات وحدة لنواة الترجمة v2 (طبقة النص المصدر + مراقب DOM) — بلا اعتماد على أي لوحة.
// التشغيل: node shared-i18n/tests/core.test.js   (playwright + chromium)
const { chromium } = require('playwright');
const path = require('path');
let pass = 0, fail = 0;
const check = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS' : 'FAIL') + ' - ' + n + (c || extra === undefined ? '' : ' ' + JSON.stringify(extra).slice(0, 300))); };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const pg = await b.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.setContent('<html lang="ar" dir="rtl"><head><title>عنوان الصفحة</title></head><body><h1 id="h">مرحبا بالعالم</h1><p id="p">  نص   فيه   فراغات  </p><input id="i" placeholder="اكتب هنا" title="تلميح"><div id="skip" data-no-i18n>مرحبا بالعالم</div><style id="st">.x{content:"مرحبا بالعالم"}</style><div id="dyn"></div><button id="lt" data-lang-toggle></button></body></html>');
  await pg.addScriptTag({ path: path.join(__dirname, '..', 'arrive-i18n.js') });
  await pg.evaluate(() => {

    ArriveI18n.init({ dom: true, defaultLang: 'ar', phrases: { 'مرحبا بالعالم': 'Hello world', 'نص فيه فراغات': 'Text with spaces', 'اكتب هنا': 'Type here', 'تلميح': 'Hint', 'عنوان الصفحة': 'Page title', 'جديد': 'New' },
      patterns: [[/^(\d+) عنصر$/, (m) => m[1] + (m[1] === '1' ? ' item' : ' items')], [/^غير مترجم (.+)$/, () => null], [/^(.+) \| (.+)$/, (m) => { const a = ArriveI18n.trText(m[1]), c = ArriveI18n.trText(m[2]); return a && c ? a + ' | ' + c : null; }]] });
  });
  const $ = (s) => pg.evaluate(s);
  check('العربية (الافتراضي): لا تغيير في أي نص', (await $("document.getElementById('h').textContent")) === 'مرحبا بالعالم' && (await $('ArriveI18n.untranslated().length')) === 0);
  await $("ArriveI18n.setLang('en')");
  check('en: نص كامل + عنوان الصفحة + placeholder/title', (await $("document.getElementById('h').textContent")) === 'Hello world' && (await $('document.title')) === 'Page title' && (await $("document.getElementById('i').placeholder")) === 'Type here' && (await $("document.getElementById('i').title")) === 'Hint');
  check('en: الفراغات الزائدة تُطبَّع في المفتاح وتُحفظ في الأطراف', (await $("document.getElementById('p').textContent")) === '  Text with spaces  ', await $("document.getElementById('p').textContent"));
  check('data-no-i18n وعناصر style لا تُترجم', (await $("document.getElementById('skip').textContent")) === 'مرحبا بالعالم' && (await $("document.getElementById('st').textContent")).includes('مرحبا'));
  await $("(function(){var d=document.getElementById('dyn');d.innerHTML='<span>3 عنصر</span> <b>جديد</b>';})()");
  await pg.waitForTimeout(50);
  check('المراقب: محتوى يُضاف ديناميكيًا يُترجم (قالب + نص كامل)', (await $("document.getElementById('dyn').innerText")) === '3 items New', await $("document.getElementById('dyn').innerText"));
  await $("(function(){document.getElementById('dyn').firstChild.textContent='1 عنصر';})()"); await pg.waitForTimeout(50);
  check('المراقب: تعديل نص موجود (characterData) يُترجم بالأصل الجديد والجمع', (await $("document.getElementById('dyn').firstChild.textContent")) === '1 item');
  await $("document.getElementById('i').setAttribute('placeholder','جديد')"); await pg.waitForTimeout(50);
  check('المراقب: تغيير attribute يُترجم', (await $("document.getElementById('i').placeholder")) === 'New');
  check('نمط يعيد null يُتخطى ويبقى النص (ويظهر في untranslated)', await $("(function(){document.getElementById('dyn').innerHTML='<i>غير مترجم س</i>';return true})()"));
  await pg.waitForTimeout(50);
  const u = await $('ArriveI18n.untranslated()');
  check('untranslated(): يعيد النص العربي المتبقي فقط', u.length === 1 && u[0] === 'غير مترجم س', u);
  check('trText يعالج «أ | ب» بنمط مركّب ويعيد null عند الفشل', (await $("ArriveI18n.trText('جديد | تلميح')")) === 'New | Hint' && (await $("ArriveI18n.trText('جديد | مجهول')")) === null);
  check('tr(): الإنجليزية تترجم، والمجهول يُسجَّل js: في untranslated', (await $("ArriveI18n.tr('جديد')")) === 'New' && (await $("ArriveI18n.tr('نص مجهول')")) === 'نص مجهول' && (await $('ArriveI18n.untranslated()')).includes('js:نص مجهول'));
  check('srcText يعيد الأصل العربي لعنصر مترجَم', (await $("ArriveI18n.srcText(document.getElementById('h'))")) === 'مرحبا بالعالم');
  await $("document.getElementById('dyn').innerHTML=''"); await $("ArriveI18n.setLang('ar')");
  check('العودة للعربية: كل النصوص والسمات تعود حرفيًا (بما فيها الفراغات)', (await $("document.getElementById('h').textContent")) === 'مرحبا بالعالم' && (await $("document.getElementById('p').textContent")) === '  نص   فيه   فراغات  ' && (await $('document.title')) === 'عنوان الصفحة' && (await $("document.getElementById('i').placeholder")) === 'جديد' && (await $("document.getElementById('i').title")) === 'تلميح');
  check('tr() بالعربية يعيد النص كما هو مع التعويض', (await $("ArriveI18n.tr('مرحبا {n}', {n: 5})")) === 'مرحبا 5');
  check('زر التبديل: يعرض اللغة الأخرى', (await $("document.getElementById('lt').textContent")) === 'English');
  check('لا أخطاء JS', errs.length === 0, errs);
  // أداء: ترجمة 5000 عقدة
  const ms = await $("(function(){ArriveI18n.setLang('en');var d=document.getElementById('dyn');var t0=performance.now();var h='';for(var i=0;i<5000;i++)h+='<span>'+(i%50)+' عنصر</span>';d.innerHTML=h;ArriveI18n.domApply();return performance.now()-t0})()");
  check('الأداء: ترجمة 5000 عقدة نصية < 1500ms', ms < 1500, ms);
  await b.close();
  console.log(`\n${pass}/${pass + fail} اختبارًا ناجحًا`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(2); });
