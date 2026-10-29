/* returns.dict.js — قاموس الإنجليزية للوحة مطابقة المرتجعات وSLA المرتجعات (نص مصدر عربي ← إنجليزي).
   - PHRASES: تطابق نصّ كامل (بعد قص الفراغات). العربية تبقى هي المصدر ولا تُعدَّل.
   - T(ar, en): قالب بمتغيرات {name}؛ {n:one|other} للجمع الإنجليزي. المتغير المنتهي بـ List يُقسَّم على «، » ويُترجَم كل عنصر.
   - قيم البيانات (أسماء الفروع/الحالات) تُترجَم للعرض فقط؛ ما لا يوجد هنا يبقى كما هو ويظهر في ArriveI18n.untranslated(). */
(function () {
  var PH = {};
  function add(o) { for (var k in o) PH[k] = o[k]; }
  var esc = function (s) { return s.replace(/[.*+?^$()|[\]\\]/g, '\\$&'); };
  var tr1 = function (x) { var r = window.ArriveI18n && ArriveI18n.trText ? ArriveI18n.trText(x) : null; return r == null ? x : r; };
  // عنصر قائمة: «اسم (عدد)» أو «اسم 78.8% من 1,106» أو «اسم 3.2 يوم من 500»
  var tv = function (x) {
    var m;
    if ((m = x.match(/^(.+?)\s+\(([\d,.]+)\)$/))) return tr1(m[1]) + ' (' + m[2] + ')';
    if ((m = x.match(/^(.+?)\s+([\d.,]+%) من ([\d,]+)$/))) return tr1(m[1]) + ' ' + m[2] + ' of ' + m[3];
    if ((m = x.match(/^(.+?)\s+([\d.,]+) يوم من ([\d,]+)$/))) return tr1(m[1]) + ' ' + m[2] + ' days from ' + m[3];
    return tr1(x);
  };
  var PATS = [];
  function T(ar, en) {
    var names = [];
    var re = new RegExp('^' + esc(ar).replace(/\\\{(\w+)\\\}/g, '{$1}').replace(/\{(\w+)\}/g, function (m, k) { names.push(k); return '(.+?)'; }) + '$');
    PATS.push([re, function (m) {
      var g = {}; names.forEach(function (k, i) { g[k] = m[i + 1]; });
      return en.replace(/\{(\w+)(?::([^|}]*)\|([^}]*))?\}/g, function (all, k, one, other) {
        var v = g[k]; if (v == null) return all;
        if (one != null) return Number(String(v).replace(/,/g, '')) === 1 ? one : other;
        if (/Raw$/.test(k)) return v;                       // إدخال المستخدم: لا يُترجَم
        if (/List$/.test(k)) return v.split('، ').map(tv).join(', ');
        return tv(v);
      });
    }]);
  }

  /* ---------- واجهة المطابقة (index.html) ---------- */
  add({
    'لوحة مطابقة المرتجعات — ARRIVE': 'Returns Matching Dashboard — ARRIVE',
    'المراجعة التشغيلية': 'Operational Audit',
    'نظام متابعة مطابقة المرتجعات': 'Returns matching tracking system',
    'الوضع الداكن': 'Dark mode', 'الوضع الفاتح': 'Light mode',
    'لوحة مطابقة المرتجعات — أكتوبر 2026': 'Returns Matching Dashboard — October 2026',
    'المرسل من الفروع مقابل المستلم، وغير المستلم، والشحنات «غير المدرجة»': 'Sent from branches vs. received, not received, and “unlisted” shipments',
    'لقطة من الشيت بتاريخ': 'Sheet snapshot dated',
    'لقطة ثابتة — غير متصلة بالشيت': 'Static snapshot — not connected to the sheet',
    'صف مشمول': 'rows included', 'فرعًا مشمولًا': 'branches included', 'يوم': 'days',
    'أقسام اللوحة': 'Dashboard sections', 'مطابقة المرتجعات': 'Returns matching', 'SLA المرتجعات': 'Returns SLA',
    'إجمالي السجلات': 'Total records', 'عوامل التصفية النشطة': 'Active filters', 'السجلات المعروضة': 'Records shown',
    'أساس حساب غير المستلم': 'Basis for “not received”',
    'تقرير بالتصفية الحالية': 'Report for current filters', 'إعادة التصفية': 'Reset filters',
    'عوامل التصفية وطريقة الحساب': 'Filters and calculation method', 'نتيجة': 'results', 'مسح الفلاتر': 'Clear filters',
    'بحث (اسم الفرع أو رقم الصف في الشيت)': 'Search (branch name or sheet row number)', 'اكتب للبحث…': 'Type to search…',
    'الفرع': 'Branch', 'من تاريخ': 'From date', 'إلى تاريخ': 'To date', 'ملاحظات الجودة': 'Quality flags',
    'كل الصفوف': 'All rows', 'عليها ملاحظة جودة فقط': 'Rows with a quality flag only', 'بدون ملاحظات فقط': 'Rows without flags only',
    'أساس حساب «غير المستلم»': 'Basis for “Not received”', 'كما هو مكتوب في عمود الشيت': 'As written in the sheet column',
    'محسوب: المرسل − (المستلم − غير المدرجة)': 'Calculated: Sent − (Received − Unlisted)',
    'الصفوف المكررة / المتابعة': 'Duplicate / follow-up rows', 'إدراج كل الصفوف (كما في الشيت)': 'Include all rows (as in the sheet)',
    'استبعاد المكرر المتطابق وصفوف المتابعة': 'Exclude exact duplicates and follow-up rows',
    'مؤشرات': 'KPIs', 'المؤشرات الرئيسية': 'Key indicators',
    'محسوبة ضمن عوامل التصفية وطريقة الحساب المختارة': 'Calculated within the selected filters and method',
    'إجمالي المرسل': 'Total sent', 'غير المستلم': 'Not received', 'نسبة المطابقة': 'Match rate',
    'شحنات «غير مدرجة»': '“Unlisted” shipments', 'صفوف عليها ملاحظة جودة': 'Rows with a quality flag',
    'اتجاهات': 'Trends', 'الاتجاهات والتوزيعات': 'Trends and distributions', 'اضغط على أي فرع داخل الرسم لتصفية اللوحة عليه': 'Click any branch in the chart to filter the dashboard by it',
    'المرسل والمطابقة يوميًا': 'Sent and matched daily', 'أعمدة: مطابق / غير مستلم — الخط: نسبة المطابقة اليومية (%)': 'Bars: matched / not received — Line: daily match rate (%)',
    'غير المستلم حسب الفرع': 'Not received by branch', 'أعلى 12 فرعًا في عدد الشحنات غير المستلمة': 'Top 12 branches by not-received shipments',
    'نسبة المطابقة حسب الفرع': 'Match rate by branch', 'أقل 12 فرعًا في نسبة المطابقة (مرسل − غير مستلم) ÷ مرسل': 'Lowest 12 branches by match rate (sent − not received) ÷ sent',
    'جودة': 'Quality', 'جودة البيانات وحساسية الأرقام': 'Data quality and sensitivity of the figures',
    'الصفوف الأصلية لم تُعدّل. كل ملاحظة معلَّمة على الصف ويمكنك استبعادها أو إبقاؤها من عوامل التصفية': 'Original rows are unchanged. Each flag is marked on its row and you can exclude or keep it using the filters',
    'الملاحظات المكتشفة': 'Detected flags', 'ضمن الفرع والتاريخ المختارين': 'Within the selected branch and dates',
    'أثر طريقة الحساب على النسبة': 'Effect of the calculation method on the rate', 'نفس الفرع والتاريخ المختارين، والصف المظلل هو الاختيار الحالي': 'Same branch and dates; the highlighted row is the current choice',
    'فروع': 'Branches', 'أداء الفروع': 'Branch performance', 'اضغط على عنوان العمود للترتيب، واضغط على الصف لتصفية الفرع': 'Click a column header to sort; click a row to filter by that branch',
    'ملخص الفروع': 'Branch summary', 'فرع': 'branches', 'عدد الصفوف': 'Rows', 'أيام التسجيل': 'Days recorded', 'المرسل': 'Sent', 'غير مدرجة': 'Unlisted', 'صفوف بملاحظات': 'Flagged rows',
    'سجل': 'Log', 'السجل التفصيلي': 'Detailed log', 'الصفوف كما في الشيت، ورقم الصف يطابق رقمه في ورقة «شهر 10»': 'Rows as in the sheet; the row number matches its number in the “Month 10” sheet',
    'صفوف شهر 10': 'Month 10 rows', 'صف': 'rows', 'صف الشيت': 'Sheet row', 'التاريخ': 'Date', 'المستلم': 'Received', 'حالة المطابقة': 'Match status', 'الملاحظات': 'Flags',
    'السابق': 'Previous', 'التالي': 'Next', 'ملاحظات على المنهجية:': 'Methodology notes:',
    'نسبة المطابقة = (المرسل − غير المستلم) ÷ المرسل. المصدر: ورقة «شهر 10» في «تقرير المرتجعات»، لقطة بتاريخ 26/10/2026 والشيت ما زال يُعدَّل، فالأرقام تتغير بعد أي تحديث فيه.':
      'Match rate = (Sent − Not received) ÷ Sent. Source: the “Month 10” sheet in the “Returns Report”, snapshot dated 26/10/2026. The sheet is still being edited, so figures change after any update to it.',
    'تواريخ 3–8 أكتوبر مكتوبة يوم/شهر وتواريخ 10–25 أكتوبر مكتوبة شهر/يوم، وقد قُرئت كلها كأيام من أكتوبر. «غير المدرجة» هي الشحنات المستلمة التي لا يوجد لها إرسال مسجّل.':
      'Dates of 3–8 October are written day/month and dates of 10–25 October are written month/day; all were read as days of October. “Unlisted” are received shipments with no recorded dispatch.',
    'الافتراضي: عمود «غير المستلم» كما هو مكتوب وكل الصفوف، ولم يُغيَّر أي تعريف دون إعلانك.': 'Default: the “Not received” column as written and all rows; no definition was changed without notice.',
    'ARRIVE — المراجعة التشغيلية': 'ARRIVE — Operational Audit', 'المصدر: تقرير المرتجعات / شهر 10': 'Source: Returns Report / Month 10', 'لقطة بتاريخ 26/10/2026': 'Snapshot dated 26/10/2026'
  });
  /* ---------- أكواد الجودة (مطابقة) ---------- */
  add({
    'مكرر متطابق': 'Exact duplicate', 'صف مطابق تمامًا لصف سابق (نفس اليوم والفرع والأرقام)': 'A row identical to an earlier row (same day, branch and figures)',
    'صف متابعة': 'Follow-up row', 'المرسل فيه = غير المستلم في الصف السابق لنفس الفرع، واحتمال أن الشحنات محسوبة مرتين': 'Its sent count equals the previous row’s not-received count for the same branch; shipments may be counted twice',
    'تكرار غير واضح': 'Unclear repetition', 'أكثر من صف لنفس الفرع واليوم بأرقام مختلفة وبدون علاقة واضحة': 'More than one row for the same branch and day with different figures and no clear relation',
    'مستلم أكبر من المرسل': 'Received exceeds sent', 'المستلم أكبر من المرسل ولا تفسره «غير المدرجة»': 'Received exceeds sent and “Unlisted” does not explain it',
    'غير مستلم لا يطابق': 'Not-received mismatch', 'عمود غير المستلم لا يطابق أي معادلة حساب': 'The not-received column matches no calculation formula',
    'حالة غير متسقة': 'Inconsistent status', 'حالة المطابقة لا تتسق مع الأرقام في الصف': 'The match status is inconsistent with the row’s figures',
    'فرعان في خانة واحدة': 'Two branches in one cell', 'خانة الفرع تحتوي فرعين معًا': 'The branch cell contains two branches',
    'تم الاستلام بالكامل': 'Fully received', 'لم يتم الاستلام بالكامل': 'Not fully received',
    'إزالة': 'Remove', 'كل الفروع': 'All branches', 'ابحث عن فرع…': 'Search for a branch…', 'تحديد الكل': 'Select all', 'مسح': 'Clear', 'لا توجد نتائج': 'No results',
    'مطابق': 'Matched', 'نسبة المطابقة %': 'Match rate %', 'شحنات': 'Shipments',
    '(المرسل − غير المستلم) ÷ المرسل': '(Sent − Not received) ÷ Sent', 'مستلمة بدون إرسال مسجّل': 'Received with no recorded dispatch',
    'لا توجد بيانات': 'No data', 'الملاحظة': 'Flag', 'صفوف': 'Rows', 'مرسل': 'Sent', 'مسح الكل': 'Clear all', 'الفلاتر النشطة:': 'Active filters:',
    'لا توجد ملاحظات ضمن التصفية الحالية': 'No flags within the current filters',
    'كما في الشيت · كل الصفوف': 'As in the sheet · all rows', 'كما في الشيت · بدون مكرر/متابعة': 'As in the sheet · excluding duplicates/follow-ups',
    'محسوب · كل الصفوف': 'Calculated · all rows', 'محسوب · بدون مكرر/متابعة': 'Calculated · excluding duplicates/follow-ups',
    'الحالة': 'Status', 'النسبة': 'Rate', 'غيّر عوامل التصفية': 'Change the filters', 'لا توجد صفوف': 'No rows', 'القيمة المكتوبة في الشيت': 'The value written in the sheet',
    'عليها ملاحظة جودة': 'Has a quality flag', 'بدون ملاحظات': 'No flags', 'استبعاد المكرر/المتابعة': 'Excluding duplicates/follow-ups', 'محسوب': 'Calculated', 'كما في الشيت': 'As in the sheet', 'إزالة الفلتر': 'Remove filter',
    'خطأ': 'Error'
  });
  T('{rows} صف · {days} يوم', '{rows} {rows:row|rows} · {days} {days:day|days}');
  T('كما في الشيت: {a} · محسوب: {b}', 'As in sheet: {a} · Calculated: {b}');
  T('{m} مطابق من {s}', '{m} matched of {s}');
  T('{p} من الصفوف · {d} مكرر/متابعة', '{p} of rows · {d} duplicate/follow-up');
  T('(الشيت: {v})', '(Sheet: {v})');
  T('عرض {a} – {b} من {c}', 'Showing {a} – {b} of {c}');
  T('الفرع: {bList}', 'Branch: {bList}');
  T('من {d}', 'From {d}'); T('إلى {d}', 'To {d}'); T('بحث: {qRaw}', 'Search: {qRaw}');
  T('استبعاد المكرر والمتابعة يزيل {a} شحنة من المرسل و{b} من غير المستلم.', 'Excluding duplicates and follow-ups removes {a} shipments from sent and {b} from not received.');
  /* ---------- SLA (واجهة) ---------- */
  add({
    'غير محدد بالمصدر': 'Not specified in source', 'تم الارتجاع للراسل': 'Returned to sender', 'أساس حساب العمر': 'Age calculation basis', 'الاتصال': 'Connection',
    'تاريخ ناقص': 'Missing date', 'تاريخ التقفيل أو تاريخ تقفيل المرتجع فاضي أو غير مقروء، فلا يُحسب له عمر': 'The closing date or the return-closing date is empty or unreadable, so no age is calculated',
    'عمر لا يطابق التواريخ': 'Age does not match dates', 'عمر الشيت يختلف عن (تاريخ تقفيل المرتجع − تاريخ التقفيل)، ولا يُعد فرق اليوم الواحد لنفس اليوم ملاحظة': 'The sheet age differs from (return-closing date − closing date); a one-day difference on the same day is not flagged',
    'فرع غير محدد': 'Unspecified branch', 'خانة فرع المرتجع فاضية أو فيها حالة بدل الفرع': 'The return-branch cell is empty or holds a status instead of a branch',
    'بيك أب فارغ': 'Empty pickup', 'تاريخ استلام البيك أب غير مسجل': 'Pickup receipt date is not recorded',
    'بوليصة متكررة': 'Repeated waybill', 'نفس رقم البوليصة ظاهر في أكثر من صف (غالبًا في أكثر من تاب)': 'The same waybill number appears in more than one row (usually in more than one tab)',
    'بحث (رقم البوليصة أو الراسل)': 'Search (waybill number or sender)', 'فرع المرتجع': 'Return branch', 'حالة الشحنة': 'Shipment status', 'الراسل': 'Sender', 'الحالة النهائية': 'Final status',
    'تقفيل المرتجع من': 'Return closed from', 'تقفيل المرتجع إلى': 'Return closed to', 'عليها ملاحظة فقط': 'Flagged only', 'كما هو في عمود الشيت': 'As in the sheet column',
    'محسوب: تاريخ تقفيل المرتجع − تاريخ التقفيل': 'Calculated: return-closing date − closing date', 'البوليصات المتكررة': 'Repeated waybills', 'كل الصفوف (كما في الشيت)': 'All rows (as in the sheet)',
    'آخر ظهور لكل بوليصة': 'Last appearance of each waybill', 'أول ظهور لكل بوليصة': 'First appearance of each waybill', 'حد الـ SLA (أيام)': 'SLA threshold (days)', 'غير محدد': 'Not set',
    'عدد المرتجعات': 'Number of returns', 'متوسط عمر المرتجع (يوم)': 'Average return age (days)', 'داخل حد الـ SLA': 'Within SLA threshold', 'خارج حد الـ SLA': 'Outside SLA threshold',
    'المرتجعات المقفلة يوميًا ومتوسط عمرها': 'Returns closed daily and their average age', 'أعمدة: عدد المرتجعات حسب تاريخ تقفيل المرتجع — الخط: متوسط العمر (يوم)': 'Bars: number of returns by return-closing date — Line: average age (days)',
    'توزيع عمر المرتجع': 'Return age distribution', 'عدد المرتجعات في كل شريحة عمر (يوم)': 'Number of returns in each age band (days)',
    'متوسط العمر حسب الفرع': 'Average age by branch', 'أعلى 12 فرعًا في متوسط العمر، والرقم بين القوسين عدد الصفوف': 'Top 12 branches by average age; the number in brackets is the row count',
    'الصفوف الأصلية لم تُعدّل. الملاحظات وسم فقط ويمكن تصفيتها': 'Original rows are unchanged. Flags are labels only and can be filtered',
    'ضمن التصفية الحالية': 'Within the current filters', 'أثر أساس حساب العمر': 'Effect of the age basis', 'نفس التصفية، والصف المظلل هو الاختيار الحالي': 'Same filters; the highlighted row is the current choice',
    'متوسط العمر': 'Average age', 'الوسيط': 'Median', 'الأقصى': 'Max', 'خارج الحد': 'Outside threshold', 'داخل الحد %': 'Within threshold %', 'داخل الحد': 'Within threshold',
    'راسلون': 'Senders', 'ملخص الراسلين': 'Sender summary', 'أول 100 راسل حسب الترتيب المختار، واضغط على الصف لتصفية الراسل': 'First 100 senders in the selected order; click a row to filter by sender',
    'الراسلون': 'Senders', 'راسل': 'senders', 'الصفوف كما في الشيت، والتاب هو اسم التاب اليومي المصدر': 'Rows as in the sheet; “Tab” is the name of the daily source tab',
    'صفوف المرتجعات': 'Return rows', 'رقم البوليصة': 'Waybill number', 'استلام البيك أب': 'Pickup receipt', 'تقفيل الشحنة': 'Shipment closing', 'تقفيل المرتجع': 'Return closing', 'العمر (يوم)': 'Age (days)', 'الـ SLA': 'SLA', 'التاب': 'Tab',
    'عمر المرتجع = تاريخ تقفيل المرتجع − تاريخ التقفيل. الافتراضي عمود «عمر المرتجع» كما هو في الشيت، والبديل المحسوب في الفلتر. «داخل الحد» = العمر ≤ الحد بالأيام، ولا يظهر أي حكم قبل إدخال حد معتمد. تواريخ الشيت يوم/شهر/سنة. أسماء الفروع موحّدة للعرض فقط (مثل «فرع رئيسى» و«فرع الرئيسى» ← الرئيسي)، والاسم الأصلي في السجل التفصيلي عند الحاجة. بوليصات كثيرة تظهر في أكثر من تاب، ولم تُستبعد افتراضيًا. الصفوف بلا تاريخ صالح لا تدخل في حساب العمر.':
      'Return age = return-closing date − closing date. The default is the sheet’s “Return age” column as written, with the calculated alternative available in the filter. “Within threshold” = age ≤ threshold in days; no verdict is shown until an approved threshold is entered. Sheet dates are day/month/year. Branch names are unified for display only (e.g. spelling variants of the main branch → Main); the original name appears in the detailed log when needed. Many waybills appear in more than one tab and are not excluded by default. Rows without a valid date are not included in the age calculation.',
    'ابحث…': 'Search…', 'متوسط العمر (يوم)': 'Average age (days)', 'أدخل حد الـ SLA بالأيام لحسابها': 'Enter the SLA threshold in days to calculate it', 'لا يُحكم قبل تحديد الحد': 'No verdict until a threshold is set',
    'محسوبة ضمن عوامل التصفية وأساس الحساب المختار': 'Calculated within the selected filters and calculation basis',
    'المعنى': 'Meaning', 'أساس الحساب': 'Calculation basis', 'المتوسط': 'Average', 'محسوب من التواريخ': 'Calculated from dates', 'الاسم في الشيت': 'Name in the sheet',
    'كل الحالات': 'All statuses', 'كل الراسلين': 'All senders', 'عليها ملاحظة': 'Has a flag', 'جارٍ الاتصال بالشيت…': 'Connecting to the sheet…', 'رد غير صالح': 'Invalid response',
    'لوحة SLA المرتجعات': 'Returns SLA Dashboard', 'عمر المرتجع من تاريخ تقفيل الشحنة إلى تاريخ تقفيل المرتجع': 'Return age from the shipment-closing date to the return-closing date',
    'نظام متابعة SLA المرتجعات': 'Returns SLA tracking system', 'المصدر: شيت Sla RTO (تابات يومية)': 'Source: Sla RTO sheet (daily tabs)', 'جارٍ التحميل…': 'Loading…', 'تعذّر تحميل البيانات': 'Could not load data',
    'مباشر من الشيت —': 'Live from the sheet —', 'لقطة ثابتة —': 'Static snapshot —', '(بدون رابط مباشر في sla.js)': '(no live link in sla.js)',
    'بوليصة مميزة': 'unique waybills'
  });
  T('{n} بوليصة مميزة', '{n} unique {n:waybill|waybills}');
  T('الوسيط {a} · الأقصى {b} · مستبعد بلا عمر: {c}', 'Median {a} · Max {b} · Excluded (no age): {c}');
  T('{a} من {b} (العمر ≤ {t})', '{a} of {b} (age ≤ {t})');
  T('العمر > {t} يوم', 'Age > {t} days');
  T('{p} من الصفوف المعروضة', '{p} of displayed rows');
  T('{n} صف يختلف فيه عمر الشيت عن المحسوب (منها فرق اليوم الواحد لنفس اليوم).', '{n} {n:row|rows} where the sheet age differs from the calculated age (including one-day differences on the same day).');
  T('الحالة: {xList}', 'Status: {xList}'); T('الراسل: {xList}', 'Sender: {xList}'); T('الحالة النهائية: {x}', 'Final status: {x}');
  T('الراسل: {xList}…', 'Sender: {xList}…');
  T('الرد ليس JSON (HTTP {s}) — غالبًا النشر ليس «Anyone» أو الرابط ليس رابط Web app', 'The response is not JSON (HTTP {s}) — the deployment is probably not “Anyone” or the link is not a Web app link');
  T('تعذّر الاتصال: {m} — يُعرض آخر بيانات محمّلة', 'Connection failed: {m} — showing the last loaded data');
  T('عمر المرتجع من تاريخ تقفيل الشحنة إلى تاريخ تقفيل المرتجع — تقفيل المرتجع: {p}', 'Return age from the shipment-closing date to the return-closing date — return closed: {p}');
  T('بيانات بتاريخ {d}', 'Data dated {d}');
  T('مباشر من الشيت — {d}', 'Live from the sheet — {d}'); T('لقطة ثابتة — {d}', 'Static snapshot — {d}');
  /* ---------- الاتصال المباشر (live.js) ---------- */
  add({ 'آخر تحديث من الشيت': 'Last update from the sheet', 'تعذّر الاتصال بالشيت — يُعرض آخر بيانات محمّلة': 'Could not connect to the sheet — showing the last loaded data' });
  T('متصل بالشيت — تحديث تلقائي كل {n} دقيقة', 'Connected to the sheet — auto-refresh every {n} minutes');
  /* ---------- التقارير (A4) ---------- */
  add({
    'إدارة المراجعة التشغيلية': 'Operational Audit Department', 'ARRIVE · إدارة المراجعة التشغيلية': 'ARRIVE · Operational Audit Department', 'تقرير مطابقة المرتجعات': 'Returns Matching Report',
    'البداية': 'start', 'النهاية': 'end', 'الصفوف الموسومة فقط': 'Flagged rows only', 'الصفوف السليمة فقط': 'Unflagged rows only', 'كما في عمود الشيت': 'As in the sheet column',
    'لا توجد بيانات وفقًا للفلاتر المحددة.': 'No data for the selected filters.', 'المرسلة والمستلمة': 'Sent and received', 'الفترة المشمولة': 'Period covered',
    'عوامل التصفية': 'Filters', 'لا توجد (كل الصفوف)': 'None (all rows)', 'لا توجد (كل الصفوف).': 'None (all rows).', 'أساس غير المستلم': 'Basis for not received', 'آخر تحديث للبيانات': 'Data last updated', 'تاريخ إصدار التقرير': 'Report issue date',
    'المصدر: ورقة «شهر 10» في «تقرير المرتجعات» · الأرقام محسوبة من الصفوف ضمن عوامل التصفية أعلاه': 'Source: “Month 10” sheet in the “Returns Report” · Figures are calculated from the rows within the filters above',
    'صفوف عليها ملاحظات جودة بيانات': 'Rows with data-quality flags', 'صفوف مكررة/متابعة قد تضخّم المرسل': 'Duplicate/follow-up rows that may inflate sent', 'مستلم أكبر من المرسل دون تفسير': 'Received exceeds sent without explanation', 'شحنات مستلمة غير مدرجة': 'Received shipments not listed',
    'الملخص التنفيذي': 'Executive summary', 'ما يحتاج انتباه الإدارة': 'What needs management attention', 'البند': 'Item', 'العدد': 'Count', 'لا توجد ملاحظات ضمن التصفية الحالية.': 'No flags within the current filters.',
    'مقارنة داخل الفترة نفسها': 'Comparison within the same period', 'أعلى الفروع في غير المستلم': 'Branches with the most not received', 'لا توجد شحنات غير مستلمة.': 'There are no unreceived shipments.',
    'أعلى 5 فروع من إجمالي غير المستلم': 'Top 5 branches’ share of total not received', 'غير المستلم «كما في الشيت»': 'Not received “as in the sheet”', 'غير المستلم «محسوب»': 'Not received “calculated”',
    'تعذّر رسم الرسم (مكتبة الرسوم غير محمّلة)': 'The chart could not be drawn (charting library not loaded)', 'الرسوم البيانية': 'Charts', 'الأداء اليومي': 'Daily performance',
    'المطابق وغير المستلم (شحنات) مع نسبة المطابقة اليومية': 'Matched and not received (shipments) with the daily match rate', 'أعلى 10 فروع في غير المستلم': 'Top 10 branches by not received', 'عدد الشحنات': 'Number of shipments',
    'أقل 10 فروع في نسبة المطابقة': 'Lowest 10 branches by match rate', 'ملاحظات': 'Flags',
    'مرتّبة بأعلى غير مستلم. الحجم والنسبة معًا هما أساس القراءة؛ الفرع ذو الحجم الصغير قد تتأرجح نسبته بسرعة.': 'Sorted by highest not received. Read volume and rate together; a small-volume branch’s rate can swing quickly.',
    'اليوم': 'Day', 'النتائج والملاحظات': 'Findings and observations', 'م': 'No.', 'الدليل (من البيانات)': 'Evidence (from the data)', 'الإجراء المقترح': 'Proposed action', 'المسؤول / الاستحقاق': 'Owner / due date',
    'الإجراءات «مقترحة» وليست قرارات معتمدة. السبب الجذري والمسؤول وتاريخ الاستحقاق غير متوفرة في مصدر البيانات، فلم تُستنتج.': 'Actions are “proposed”, not approved decisions. The root cause, owner and due date are not available in the data source, so they were not inferred.',
    'جودة البيانات': 'Data quality', 'لا توجد ملاحظات جودة ضمن التصفية الحالية.': 'No quality flags within the current filters.', 'حساسية النسبة لطريقة الحساب': 'Rate sensitivity to the calculation method', 'مستلم': 'Received',
    'الصفوف كما في ورقة «شهر 10» ورقمها يطابق رقم الصف في الشيت. يظهر هذا القسم عندما لا يتجاوز عدد الصفوف المشمولة 120 صفًا.': 'Rows as in the “Month 10” sheet; the number matches the sheet row number. This section appears when the included rows do not exceed 120.',
    'الختام ومنهجية الإعداد': 'Conclusion and methodology', 'أساس الإعداد': 'Basis of preparation', 'تواريخ الشيت مختلطة (يوم/شهر وشهر/يوم) وقد وُحّدت كتواريخ أكتوبر.': 'Sheet dates are mixed (day/month and month/day) and were unified as October dates.',
    'حدود التقرير': 'Report limitations', 'الصفوف لم تُعدَّل؛ وسوم الجودة للتنبيه فقط ولا تثبت سببًا لأي فرق.': 'Rows were not modified; quality flags are alerts only and do not establish a cause for any difference.',
    'لا توجد بيانات لفترة سابقة في المصدر، لذا المقارنة الواردة هي بين نصفي الفترة المختارة وليست مع شهر سابق.': 'The source has no data for a prior period, so the comparison is between the two halves of the selected period, not with a previous month.',
    'الإجراءات الواردة مقترحة وتحتاج اعتماد الإدارة قبل اعتبارها قرارًا.': 'The actions listed are proposals and need management approval before being treated as decisions.',
    'إعداد': 'Prepared by', 'مراجعة': 'Reviewed by', 'اعتماد': 'Approved by', 'نهاية التقرير': 'End of report', 'تتطلب المقارنة يومين على الأقل.': 'The comparison requires at least two days.', 'المؤشر': 'Indicator', 'التغيّر': 'Change',
    'النصف الأول مقابل الأخير من أيام التصفية الحالية، وليست مقارنة بشهر سابق.': 'First half vs. last half of the current filter’s days; not a comparison with a previous month.',
    'تركّز غير المستلم في عدد محدود من الفروع': 'Not-received is concentrated in a few branches', 'مراجعة مرتجعات هذه الفروع ومتابعة استلام الشحنات المتبقية.': 'Review these branches’ returns and follow up on receiving the remaining shipments.',
    'فروع بنسبة مطابقة منخفضة مع حجم إرسال معتبر (50 شحنة فأكثر)': 'Branches with a low match rate and meaningful sending volume (50+ shipments)', 'مقارنة سجلات الإرسال بسجلات الاستلام لهذه الفروع.': 'Compare dispatch records with receipt records for these branches.',
    'اختلاف بين غير المستلم المسجّل والمحسوب': 'Difference between recorded and calculated not received', 'مراجعة الصفوف الموسومة «غير مستلم لا يطابق» وتصحيح الشيت إن لزم.': 'Review rows flagged “Not-received mismatch” and correct the sheet if needed.',
    'صفوف مكررة أو متابعة': 'Duplicate or follow-up rows', 'تأكيد هل هي إدخالات مكررة أم دفعات متابعة فعلية.': 'Confirm whether these are duplicate entries or genuine follow-up batches.', 'مراجعة قيد الإرسال لهذه الصفوف.': 'Review the dispatch record for these rows.',
    'شحنات مستلمة بلا إرسال مسجّل': 'Received shipments with no recorded dispatch', 'تسجيل إرسالها في الفرع المرسل.': 'Record their dispatch at the sending branch.',
    'لا توجد ملاحظات بارزة ضمن التصفية الحالية': 'No notable observations within the current filters', 'متابعة دورية.': 'Periodic follow-up.',
    'معاينة التقرير': 'Report preview', 'طباعة / حفظ PDF': 'Print / Save as PDF', 'إغلاق': 'Close', 'تعذّر إعداد التقرير.': 'Could not prepare the report.', 'نقطة': 'pts'
  });
  T('الفترة: {p}', 'Period: {p}'); T('الفروع: {bList}', 'Branches: {bList}');
  T('الفترة: {a} إلى {b}', 'Period: {a} to {b}');
  T('{r} صف · {b} فرع · {d} يوم. نسبة المطابقة = (المرسل − غير المستلم) ÷ المرسل = {m} ÷ {s}.', '{r} {r:row|rows} · {b} {b:branch|branches} · {d} {d:day|days}. Match rate = (Sent − Not received) ÷ Sent = {m} ÷ {s}.');
  T('{x} صف', '{x} {x:row|rows}'); T('{x} فرع', '{x} {x:branch|branches}'); T('{x} يوم', '{x} {x:day|days}');
  T('صفحة {i} من {n}', 'Page {i} of {n}');
  T('عدد الصفوف المشمولة: {n} للفترة {p}.', 'Rows included: {n} for the period {p}.');
  T('عوامل التصفية: {x}', 'Filters: {x}');
  T('نسبة المطابقة = (المرسل − غير المستلم) ÷ المرسل. أساس غير المستلم: {x}.', 'Match rate = (Sent − Not received) ÷ Sent. Basis for not received: {x}.');
  T('المصدر: ورقة «شهر 10» في «تقرير المرتجعات»؛ آخر تحديث: {x}. الأرقام تتغير بتغير الشيت.', 'Source: “Month 10” sheet in the “Returns Report”; last updated: {x}. Figures change as the sheet changes.');
  T('{a} ({b}/{c})', '{a} ({b}/{c})');
  T('{xList} = {s} شحنة، أي {p} من غير المستلم.', '{xList} = {s} shipments, i.e. {p} of not received.');
  T('{x} صف قد يضخّم المرسل؛ لاحظ أثر استبعادها في قسم جودة البيانات.', '{x} {x:row|rows} may inflate sent; see the effect of excluding them in the data-quality section.');
  T('{x} صف المستلم فيه أكبر من المرسل ولا تفسره «غير المدرجة».', '{x} {x:row has|rows have} received greater than sent that “Unlisted” does not explain.');
  T('{x} شحنة «غير مدرجة».', '{x} “unlisted” {x:shipment|shipments}.');
  T('نسبة المطابقة {p}.', 'Match rate {p}.');
  T('المسجّل {a} مقابل المحسوب {b} (فرق {c}).', 'Recorded {a} vs. calculated {b} (difference {c}).');
  T('الفترة: {p}', 'Period: {p}');
  /* ---------- تقرير SLA ---------- */
  add({
    'تقرير SLA المرتجعات': 'Returns SLA Report', 'عمر المرتجع حتى التقفيل': 'Return age to closing', 'كما في عمود «عمر المرتجع» بالشيت': 'As in the sheet’s “Return age” column',
    'غير محدد بالمصدر (لم يُدخل حد معتمد، فلا يُصدر حكم داخل/خارج الحد)': 'Not specified (no approved threshold entered, so no within/outside verdict is issued)', 'حد الـ SLA': 'SLA threshold',
    'المصدر: شيت «Sla RTO» (تابات يومية) · الأرقام محسوبة من الصفوف ضمن عوامل التصفية أعلاه': 'Source: “Sla RTO” sheet (daily tabs) · Figures are calculated from the rows within the filters above',
    'لم يُحدد حد SLA معتمد، لذلك لا يُحكم على الالتزام.': 'No approved SLA threshold has been set, so compliance cannot be judged.', 'أعلى الفروع في متوسط العمر': 'Branches with the highest average age',
    'صفوف بوليصاتها متكررة بين التابات': 'Rows whose waybills repeat across tabs', 'بوليصات مميزة': 'Unique waybills', 'متوسط العمر «كما في الشيت»': 'Average age “as in the sheet”', 'متوسط العمر «محسوب»': 'Average age “calculated”',
    'المرتجعات اليومية ومتوسط عمرها': 'Daily returns and their average age', 'عدد المرتجعات حسب تاريخ تقفيل المرتجع، والخط متوسط العمر (يوم)': 'Number of returns by return-closing date; the line is average age (days)',
    'أعلى 10 فروع في متوسط العمر': 'Top 10 branches by average age', 'شريحة العمر (يوم)': 'Age band (days)', 'التراكمي': 'Cumulative', 'الحكم': 'Verdict', 'يتجاوز الحد (كليًا أو جزئيًا)': 'Exceeds the threshold (fully or partly)',
    'عمود «الحكم» غير محدد بالمصدر لأن حد الـ SLA غير مُدخل.': 'The “Verdict” column is not specified because the SLA threshold was not entered.',
    'مرتّبة بأعلى متوسط عمر. الفرع ذو الصفوف القليلة قد يتأرجح متوسطه بسرعة، فاقرأ المتوسط مع عدد الصفوف.': 'Sorted by highest average age. A branch with few rows can have a volatile average, so read the average together with the row count.',
    'أكثر الراسلين مرتجعات': 'Senders with the most returns', 'الأداء اليومي حسب تقفيل المرتجع': 'Daily performance by return closing', 'تاريخ التقفيل': 'Closing date', 'حساسية العمر لأساس الحساب': 'Age sensitivity to the calculation basis',
    'البوليصة': 'Waybill', 'العمر': 'Age', 'الأعلى عمرًا حسب أساس الحساب المختار، للمتابعة المباشرة. السجل الكامل متاح في اللوحة.': 'Oldest by the selected calculation basis, for direct follow-up. The full log is available in the dashboard.',
    'أساس الحساب:': 'Calculation basis:', 'البوليصات المتكررة بين التابات': 'Waybills repeated across tabs', 'مُدرجة كلها (كما في الشيت)': 'all included (as in the sheet)', 'مفلترة حسب الخيار المحدد': 'filtered per the selected option',
    'لا توجد بيانات لفترة سابقة في المصدر، والمقارنة الواردة بين نصفي الفترة المختارة وليست مع شهر سابق.': 'The source has no data for a prior period; the comparison is between the two halves of the selected period, not with a previous month.',
    'حد الـ SLA غير معتمد في المصدر': 'The SLA threshold is not approved in the source', 'اعتماد حد SLA للمرتجعات ثم إدخاله في فلتر «حد الـ SLA» لإعادة إصدار التقرير.': 'Approve an SLA threshold for returns, then enter it in the “SLA threshold” filter to reissue the report.',
    'مراجعة المرتجعات خارج الحد بدءًا من الأقدم (قسم أقدم المرتجعات).': 'Review returns outside the threshold starting with the oldest (see the oldest returns section).', 'متابعة هذه الفروع أولًا.': 'Follow up on these branches first.',
    'مقارنة مراحل المرتجع في هذه الفروع (الاستلام ← التقفيل).': 'Compare return stages in these branches (receipt → closing).', 'تركّز المرتجعات خارج الحد في فروع محددة': 'Returns outside the threshold are concentrated in specific branches',
    'بوليصات متكررة بين التابات': 'Waybills repeated across tabs', 'تأكيد هل هي إعادة محاولة فعلية أم إدخال مكرر، واستخدم فلتر «البوليصات المتكررة» لمقارنة الأثر.': 'Confirm whether these are genuine retries or duplicate entries, and use the “Repeated waybills” filter to compare the effect.',
    'صفوف بلا فرع محدد بالمصدر': 'Rows with no branch specified in the source', 'استكمال خانة فرع المرتجع في الشيت حتى تُنسب النتائج للفروع.': 'Complete the return-branch cell in the sheet so results can be attributed to branches.',
    'صفوف لا يمكن الاعتماد على عمرها': 'Rows whose age cannot be relied on', 'مراجعة التواريخ في الصفوف الموسومة وتصحيحها في الشيت.': 'Review dates in the flagged rows and correct them in the sheet.',
    '1 يوم أو أقل': '1 day or less', '16 فأكثر': '16+', 'ملاحظات جودة': 'Quality flags'
  });
  T('تقفيل المرتجع: {p}', 'Return closed: {p}');
  T('تقفيل المرتجع: {a} إلى {b}', 'Return closed: {a} to {b}');
  T('{t} يوم (داخل الحد = العمر ≤ {t2})', '{t} days (within threshold = age ≤ {t2})');
  T('{n} صف · {u} بوليصة · {b} فرع', '{n} {n:row|rows} · {u} {u:waybill|waybills} · {b} {b:branch|branches}');
  T('{a} بوليصة · {b} فرع', '{a} waybills · {b} branches');
  T('الراسل: {xList} و{k} آخرين', 'Sender: {xList} and {k} others');
  T('{d} (مباشر)', '{d} (live)'); T('{d} (لقطة)', '{d} (snapshot)');
  T('الوسيط {a} يوم · الأقصى {b} يوم · {c} صفًا لها عمر مقروء و{d} صفًا بلا عمر (مستبعدة من المتوسط). داخل الحد = {w} من {n}.', 'Median {a} days · Max {b} days · {c} rows with a readable age and {d} rows with no age (excluded from the average). Within threshold = {w} of {n}.');
  T('الوسيط {a} يوم · الأقصى {b} يوم · {c} صفًا لها عمر مقروء. لم يُحدد حد SLA معتمد، لذلك لا يُحكم على الالتزام.', 'Median {a} days · Max {b} days · {c} rows with a readable age. No approved SLA threshold has been set, so compliance cannot be judged.');
  T('الوسيط {a} يوم · الأقصى {b} يوم · {c} صفًا لها عمر مقروء و{d} صفًا بلا عمر (مستبعدة من المتوسط). لم يُحدد حد SLA معتمد، لذلك لا يُحكم على الالتزام.', 'Median {a} days · Max {b} days · {c} rows with a readable age and {d} rows with no age (excluded from the average). No approved SLA threshold has been set, so compliance cannot be judged.');
  T('الوسيط {a} يوم · الأقصى {b} يوم · {c} صفًا لها عمر مقروء. داخل الحد = {w} من {n}.', 'Median {a} days · Max {b} days · {c} rows with a readable age. Within threshold = {w} of {n}.');
  T('فروع بـ {n} صفًا فأكثر.', 'Branches with {n}+ rows.');
  T('لا يوجد فرع بـ {n} صفًا فأكثر ضمن التصفية.', 'No branch has {n}+ rows within the filter.');
  T('فروع بـ {n} صفًا فأكثر، والرقم بين القوسين عدد الصفوف', 'Branches with {n}+ rows; the number in brackets is the row count');
  T('عدد المرتجعات في كل شريحة عمر (يوم) — الأحمر يتجاوز الحد', 'Number of returns in each age band (days) — red exceeds the threshold');
  T('الأساس: {n} صفًا لها عمر. عمود «الحكم» غير محدد بالمصدر لأن حد الـ SLA غير مُدخل.', 'Basis: {n} rows with an age. The “Verdict” column is not specified because the SLA threshold was not entered.');
  T('الأساس: {n} صفًا لها عمر. الشريحة التي تحتوي أعمارًا على جانبي الحد ({t}) تُعلَّم «يتجاوز الحد» ولو جزئيًا؛ استخدم عدد «خارج الحد» الدقيق في الملخص.', 'Basis: {n} rows with an age. A band containing ages on both sides of the threshold ({t}) is marked “Exceeds the threshold” even if partly; use the exact “Outside threshold” count in the summary.');
  T('« {u} » صفوف لم يحدد المصدر فرعها.', '“{u}”: rows whose branch the source did not specify.');
  T('أعلى 25 راسلًا بعدد الصفوف من أصل {n} راسلًا ضمن التصفية الحالية.', 'Top 25 senders by row count out of {n} senders within the current filters.');
  T('{n} صفًا يختلف فيه عمر الشيت عن المحسوب (لا يُحتسب فرق اليوم الواحد لنفس اليوم). الأساس المعتمد في هذا التقرير: {m}.', '{n} rows where the sheet age differs from the calculated age (a one-day difference on the same day is not counted). Basis used in this report: {m}.');
  T('أقدم 18 مرتجعًا ضمن التصفية', 'Oldest 18 returns within the filter');
  T('عدد الصفوف المشمولة: {n} ({u} بوليصة) لتقفيل مرتجع في الفترة {p}.', 'Rows included: {n} ({u} waybills) for return closings in the period {p}.');
  T('عمر المرتجع = تاريخ تقفيل المرتجع − تاريخ التقفيل. أساس الحساب: {m}.', 'Return age = return-closing date − closing date. Calculation basis: {m}.');
  T('حد الـ SLA: {x}.', 'SLA threshold: {x}.');
  T('المصدر: شيت «Sla RTO» (تابات يومية)؛ آخر تحديث: {x}. الأرقام تتغير بتغير الشيت.', 'Source: “Sla RTO” sheet (daily tabs); last updated: {x}. Figures change as the sheet changes.');
  T('الصفوف بلا تاريخ صالح لا تدخل في حساب العمر ({n} في هذا التقرير).', 'Rows without a valid date are excluded from the age calculation ({n} in this report).');
  T('البوليصات المتكررة بين التابات {x}، وقد تضخّم العدد إن كانت إدخالًا مكررًا.', 'Waybills repeated across tabs are {x}, and may inflate the count if they are duplicate entries.');
  T('{x}، وقد تضخّم العدد إن كانت إدخالًا مكررًا.', '{x}, and may inflate the count if they are duplicate entries.');
  T('لا يمكن الحكم على الالتزام (داخل/خارج الحد). متوسط العمر {a} يوم، الوسيط {b}، الأقصى {c}.', 'Compliance cannot be judged (within/outside the threshold). Average age {a} days, median {b}, max {c}.');
  T('الالتزام بحد الـ SLA ({t} يوم)', 'Compliance with the SLA threshold ({t} days)');
  T('{w} من {n} ({p}) داخل الحد، و{l} خارجه.', '{w} of {n} ({p}) within the threshold and {l} outside it.');
  T('فروع متوسط عمرها أعلى من المتوسط العام بيوم فأكثر ({n} صفًا فأكثر)', 'Branches whose average age is at least a day above the overall average ({n}+ rows)');
  T('{aList} مقابل المتوسط العام {b}.', '{aList} vs. an overall average of {b}.');
  T('{aList} = {s} مرتجعًا، أي {p} مما خارج الحد.', '{aList} = {s} returns, i.e. {p} of those outside the threshold.');
  T('{a} صفًا ({p}) بوليصتها ظاهرة في أكثر من تاب، والبوليصات المميزة {u} من {t} صفًا.', '{a} rows ({p}) have waybills appearing in more than one tab; unique waybills are {u} of {t} rows.');
  T('{n} صفًا ({p}) تظهر تحت «{u}».', '{n} rows ({p}) appear under “{u}”.');
  T('{a} صفًا بلا تاريخ صالح، و{b} صفًا عمر الشيت فيها لا يطابق التواريخ.', '{a} rows without a valid date and {b} rows whose sheet age does not match the dates.');
  T('{x} ({d}/{n})', '{x} ({d}/{n})');
  T('{x} يوم من {r}', '{x} days from {r}');
  T('{b} {x} يوم من {r}', '{b} {x} days from {r}');

  PATS.push([/^(.+)\.$/, function (m) { var it = m[1].split('، '); return it.every(function (i) { return /\s[\d.,]+% من [\d,]+$/.test(i); }) ? it.map(tv).join(', ') + '.' : null; }]);   // قائمة «فرع 78% من 1,106، …»
  T('{x} نقطة', '{x} pts');
  PATS.push([/^(.+?) — (.+)$/, function (m) { var a = ArriveI18n.trText(m[1]), b = ArriveI18n.trText(m[2]); return a != null && b != null ? a + ' — ' + b : null; }]);   // «الملاحظة — شرحها»
  add({
    'صف ·': 'rows ·', 'بوليصة ·': 'waybills ·', 'عدد الصفوف المشمولة:': 'Rows included:', 'للفترة': 'for the period', 'الصفوف': 'Rows', 'بوليصة) لتقفيل مرتجع في الفترة': 'waybills) for return closings in the period',
    'الصفوف لم تُعدَّل؛ وسوم الجودة للتنبيه فقط، وأسماء الفروع موحّدة للعرض فقط.': 'Rows were not modified; quality flags are alerts only, and branch names are unified for display only.',
    'مرتّبة بأعلى متوسط عمر. الفرع ذو الصفوف القليلة قد يتأرجح متوسطه بسرعة، فاقرأ المتوسط مع عدد الصفوف. «غير محدد بالمصدر» صفوف لم يحدد المصدر فرعها.': 'Sorted by highest average age. A branch with few rows can have a volatile average, so read the average together with the row count. “Not specified in source”: rows whose branch the source did not specify.'
  });
  /* ---------- قيم البيانات (عرض فقط): حالات وأسماء فروع (مع توحيد الإملاء) ---------- */
  add({
    'في الطريق للتاجر': 'On the way to the merchant', 'فى الطريق للتاجر': 'On the way to the merchant', 'تقفيل مرتجع': 'Return closed', 'مرتجعات الى الفروع': 'Returns to branches', 'مرتجعات الي الفروع': 'Returns to branches',
    'تم الارتجاع للفرع': 'Returned to branch', 'مرتجعات معلقه': 'Returns on hold', 'مرتجعات معلقة': 'Returns on hold', 'مرتجعات الي الرئيسي': 'Returns to the main branch',
    'غير مستلم': 'Not received', 'عرض': 'Showing', 'من': 'of'
  });
  var normB = function (s) { return s.replace(/^فرع\s+/, '').replace(/[أإآ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[ىي]/g, 'ي').replace(/[ةه]/g, 'ه').replace(/^ال/, '').replace(/\s/g, ''); };
  var BR = { 'رئيسي': 'Main', 'اسكندريه': 'Alexandria', 'طنطا': 'Tanta', 'حدائق': 'Hadayek', 'حدائققبه': 'Hadayek El Qobba', 'حدائق القبة': 'Hadayek El Qobba', 'عجوزه': 'Agouza', 'موسسه': 'Al Mo’assasa', 'منصوره': 'Mansoura', 'امنصوره': 'Mansoura',
    'هرم': 'Haram', 'شروق': 'Shorouk', 'معادي': 'Maadi', 'زقازيق': 'Zagazig', 'مدينهنصر': 'Nasr City', 'مصرالجديده': 'Heliopolis (Misr El Gedida)', 'اكتوبر': '6th of October', 'رئيسي': 'Main' };
  var BRN = {}; Object.keys(BR).forEach(function (k) { BRN[normB(k)] = BR[k]; BRN[k] = BR[k]; });
  PATS.push([/^\((.+)\)$/, function (m) { var r = ArriveI18n.trText(m[1]); return r == null ? null : '(' + r + ')'; }]);   // الاسم الأصلي بين قوسين
  PATS.push([/^(?:فرع\s+)?(.+)$/, function (m) { var e = BRN[normB(m[1])]; return e == null ? null : e; }]);              // اسم فرع (آخر نمط)

  PH['نسبة المطابقة = (المرسل − غير المستلم) ÷ المرسل. المصدر: ورقة «شهر 10» في «تقرير المرتجعات»، لقطة بتاريخ 26/10/2026 والشيت ما زال يُعدَّل، فالأرقام تتغير بعد أي تحديث فيه.' + ' ' + 'تواريخ 3–8 أكتوبر مكتوبة يوم/شهر وتواريخ 10–25 أكتوبر مكتوبة شهر/يوم، وقد قُرئت كلها كأيام من أكتوبر. «غير المدرجة» هي الشحنات المستلمة التي لا يوجد لها إرسال مسجّل.' + ' ' + 'الافتراضي: عمود «غير المستلم» كما هو مكتوب وكل الصفوف، ولم يُغيَّر أي تعريف دون إعلانك.'] = PH['نسبة المطابقة = (المرسل − غير المستلم) ÷ المرسل. المصدر: ورقة «شهر 10» في «تقرير المرتجعات»، لقطة بتاريخ 26/10/2026 والشيت ما زال يُعدَّل، فالأرقام تتغير بعد أي تحديث فيه.'] + ' ' + PH['تواريخ 3–8 أكتوبر مكتوبة يوم/شهر وتواريخ 10–25 أكتوبر مكتوبة شهر/يوم، وقد قُرئت كلها كأيام من أكتوبر. «غير المدرجة» هي الشحنات المستلمة التي لا يوجد لها إرسال مسجّل.'] + ' ' + PH['الافتراضي: عمود «غير المستلم» كما هو مكتوب وكل الصفوف، ولم يُغيَّر أي تعريف دون إعلانك.'];   // ملاحظات المنهجية: ثلاث جمل في عقدة نصية واحدة
  window.RETURNS_I18N = { phrases: PH, patterns: PATS };
})();
