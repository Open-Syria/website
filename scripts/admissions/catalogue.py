"""Shared source metadata, naming and condition parsers for the admissions catalogues."""
import json
import re
import hashlib
from pathlib import Path
from collections import Counter
from normalize import normalize

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/app/[locale]/admissions/_data/2026-2027'
SOURCE = Path(__file__).parent / '2026-2027/rows.json'

def text(ar, en=None):
    return {'ar': ar, 'en': en or ar}

def display_name(name):
    # Rendered PDF 1 pp23/28, PDF 5 p3 and a recheck of PDF 2 p10 confirm these labels.
    # Repair only display text, preserving source-derived IDs and exam identities.
    return (name.replace('تقديم الي امج', 'تقديم البرامج').replace('( ي الإخراج', '( الإخراج')
            .replace('تقويم الكالم واللغة', 'تقويم الكلام واللغة')
            .replace('اأطراف الاصطناعية', 'الأطراف الاصطناعية')
            .replace('التحليل المخبر ي', 'التحليل المخبري'))

def manual(ar, en):
    return {'type': 'manual', 'label': text(ar, en)}

def exam(key, ar, en, after=False):
    return {'type': 'exam', 'id': key, 'label': text(ar, en),
            'stage': 'after_admission' if after else 'before_application'}

def stable_id(value):
    return hashlib.sha256(value.encode()).hexdigest()[:12]

GOVERNORATES = {
    'دمشق': ('damascus', 'Damascus'), 'ريف دمشق': ('rif-dimashq', 'Rif Dimashq'),
    'حلب': ('aleppo', 'Aleppo'), 'حمص': ('homs', 'Homs'), 'حماة': ('hama', 'Hama'),
    'اللاذقية': ('latakia', 'Latakia'), 'طرطوس': ('tartous', 'Tartous'),
    'إدلب': ('idlib', 'Idlib'), 'الحسكة': ('hasakah', 'Hasakah'),
    'دير الزور': ('deir-ez-zor', 'Deir ez-Zor'), 'الرقة': ('raqqa', 'Raqqa'),
    'درعا': ('daraa', 'Daraa'), 'السويداء': ('sweida', 'Sweida'),
    'القنيطرة': ('quneitra', 'Quneitra'),
}
CITY_GOV = {'مصياف': 'حماة', 'منبج': 'حلب', 'الرميلان': 'الحسكة'}
SUBJECTS = {
    'الرياضيات': 'math', 'الفيزياء': 'physics', 'الكيمياء': 'chemistry',
    'العلوم': 'biology', 'العربية': 'arabic', 'الإنكليزية': 'english',
    'الفرنسية': 'french', 'الروسية': 'russian', 'الدينية': 'religion',
    'أجنبية': 'foreign_language', 'الأجنبية': 'foreign_language', 'عربية': 'arabic', 'إنكليزية': 'english',
}

def field_for(name):
    # Specific occupations precede broader faculty names.
    if re.search('زراع|بيطر|أغذية|الغذائية|الغذاء|التصحر|المتوسطية|للري|الحيوية', name): return 'agriculture'
    if re.search('سياح|فندق', name): return 'tourism'
    if re.search('تعليم|تدريس|التربية|التربوي|التربوية|الإرشاد|معلم|رياض الأطفال', name): return 'education'
    if re.search('الشريعة|الشرعية|اللاهوت|أصول الدين|القرآن|الإسلامية|الدعوة|الفقه', name): return 'religion'
    if re.search('علوم سياسية|العلوم السياسية|حقوق|القانون', name): return 'law'
    if re.search('اللغة|اللغات|للترجمة|الترجمة', name): return 'languages'
    if re.search('إدارة|إدارية|الإدارية|مالية|مصرف|محاسب|اقتصاد|الاقتصاد|التجارة|ريادة|إحصا', name): return 'business'
    if re.search('إعلام|للإعلام|الإعلام|الإذاعي|التلفزيوني', name): return 'media'
    if re.search('فنون|تصميم داخلي|التصميم الداخلي|تصميم غرافيكي|التصميم الغرافيكي|التصميم الجرافيكي|الأداء', name): return 'arts'
    if re.search('حاس|برمج|معلومات|ذكاء|الذكية|رقمية', name): return 'technology'
    if re.search('هندس|ميكانيك|كهرب|إلكترون|الكترون|طاقة|طاقات|تجهيز|صيانة|تقنيات|تقانات الأجهزة|تبريد|تدفئة|ميكاتر|اتصالات|نفط|غاز|حديدية|صناع|بحري|البيئة', name): return 'engineering'
    if re.search('طب|صحي|صحة|صحية|تمريض|قبالة|مخابر|مخبر|تخدير|تجميل|صيدل|علاج|معالجة|بصري|أطراف|أسنان|التحضيرية|علوم التجميل|التغذية', name): return 'health'
    if re.search('العلوم|الرياضيات|الفيزياء|الكيمياء|الجيولوجيا', name): return 'science'
    return 'humanities'

def threshold(value):
    if not value or value == '-': return 'unavailable'
    if 'جميع المتقدم' in value: return None
    value = value.split('+')[0].strip().strip('()').strip()
    match = re.fullmatch(r'/?\s*(\d+(?:\.\d+)?)\s*%?\s*/?\s*(?:درجة)?', value)
    assert match, f'Unparsed threshold: {value}'
    number = float(match.group(1))
    assert 0 <= number <= 100
    return int(number) if number.is_integer() else number

def table_conditions(value, name):
    """Parse every nonempty ordinary-route condition; fail closed on unknown text."""
    if not value or value == '-': return []
    if 'الدوام' in value: return []  # Study location, recorded in program notes.
    conditions = []
    percentages = [float(v) for v in re.findall(r'(\d+(?:\.\d+)?)\s*/?\s*%', value)]
    subjects = []
    for arabic, key in SUBJECTS.items():
        pos = value.find(arabic)
        if pos >= 0 and key not in [s[1] for s in subjects]: subjects.append((pos, key))
    subjects.sort()
    if percentages:
        assert subjects, f'Unparsed subject condition: {value}'
        assert len(percentages) == len(subjects), f'Ambiguous condition: {value}'
        conditions.extend({'type': 'subject', 'subject': s, 'minPercent': n}
                          for (_, s), n in zip(subjects, percentages))
    if 'بعد القبول' in value:
        conditions.append(exam('post-admission-assessment',
            'اجتياز الفحص أو المقابلة بعد القبول.', 'Pass the assessment or interview after admission.', True))
        if '2003' in value: conditions.append({'type': 'birth_year', 'minimum': 2003})
    elif re.search('اختبار|امتحان|فحص', value):
        if re.search('معمار|العمارة', name) and 'الفنون' not in value:
            conditions.append(exam('architecture-exam', 'النجاح في اختبار العمارة قبل تدوين الرغبة (11 تشرين الأول 2026).',
                'Pass the architecture entrance exam before listing this choice (11 October 2026).'))
        else:
            # Preserve exact dates, with a clear label. No unsupported self-certification.
            dates = list(dict.fromkeys(re.findall(r'2026\s*/\s*10\s*/\s*\d+', value)))
            dates = [re.sub(r'\s+', '', date) for date in dates]
            label = 'اجتياز اختبار القبول قبل تدوين الرغبة.'
            if dates: label += ' الموعد: ' + ' – '.join(dates) + '.'
            elif 'امتحان' in value: label = 'النجاح في ' + value[value.index('امتحان'):] + '.'
            conditions.append(exam('entrance-'+stable_id(name), label,
                'Pass the entrance assessment before listing this choice. Dates: '+ ' – '.join(dates)+'.'))
    if 'المتقدمات' in value: conditions.append({'type': 'gender', 'value': 'female'})
    assert conditions or value.startswith('جميع المتقدم'), f'Unparsed condition: {value}'
    return conditions

def base_conditions(row):
    name = row['name']
    conditions, refs = [], []
    if 'إناث' in name: conditions.append({'type': 'gender', 'value': 'female'})
    if 'ذكور' in name: conditions.append({'type': 'gender', 'value': 'male'})
    regional = regional_conditions(name)
    if regional:
        conditions += regional
        refs.append({'announcement': 1, 'page': 6 if 'الشرقية' in name else 5})
    if 'مدرسة التمريض' in name:
        conditions.extend([{'type': 'birth_year', 'minimum': 2004}, manual(
            'يشترط استيفاء شروط الإقامة واللياقة الطبية الواردة لمدارس التمريض في إعلان الوزارة.',
            'The nursing-school residence and medical-fitness requirements must also be met.')])
        refs.append({'announcement': 1, 'page': 5})
    if row['sector'] == 'private' and '+' in row['private']:
        conditions.extend(table_conditions(row['private'].split('+', 1)[1], name))
    return conditions, refs


def regional_conditions(name):
    """PDF 1 p5(7), p6(1) and PDF 3 p4(5): certificate-issuing governorate.

    Reserved local/eastern rows require the named origin. Ordinary 'محافظات'
    rows have no additional origin restriction; PDF 1 p6(4) explicitly allows
    eastern applicants to list ordinary general/parallel choices as well.
    """
    if 'أبناء' not in name and 'للمحافظات الشرقية' not in name:
        return []
    if 'الشرقية' in name:
        allowed = ['deir-ez-zor', 'hasakah', 'raqqa']
    else:
        origin = name.split('أبناء', 1)[1]
        allowed = [key for ar, (key, _) in GOVERNORATES.items() if ar in origin]
    assert allowed, f'Unknown regional certificate origin: {name}'
    return [{'type': 'governorate', 'allowed': allowed}]

# Existing curated translations are reused only for exact official names.
seed = json.loads((SOURCE.parent / 'source-catalogue.json').read_text(encoding='utf-8'))
translations = {normalize(ar): en for ar, en in json.loads((SOURCE.parent / 'translations.json').read_text(encoding='utf-8')).items()}
translations.update({
    'السنة التحضيرية': 'Preparatory year for medical faculties',
    'الهندسة المعلوماتية': 'Information Technology Engineering',
    'الهندسة المدنية': 'Civil Engineering', 'الهندسة المعمارية': 'Architecture',
    'الطب البشري': 'Medicine', 'طب الأسنان': 'Dentistry', 'الصيدلة': 'Pharmacy',
    'الهندسة الزراعية': 'Agricultural Engineering', 'الطب البيطري': 'Veterinary Medicine',
    'الاقتصاد': 'Economics', 'الحقوق': 'Law', 'العلوم السياسية': 'Political Science',
    'السياحة': 'Tourism', 'التمريض': 'Nursing', 'اللغة العربية': 'Arabic Language',
    'اللغة الإنكليزية': 'English Language', 'اللغة الفرنسية': 'French Language',
    'اللغة الروسية': 'Russian Language', 'اللغة التركية': 'Turkish Language',
    'اللغة الفارسية': 'Persian Language', 'الفنون الجميلة': 'Fine Arts',
    'الجغرافية': 'Geography', 'الآثار': 'Archaeology', 'التاريخ': 'History',
    'المعهد التقاني للحاسوب': 'Technical Computer Institute',
    'المعهد التقاني الزراعي': 'Agricultural Technical Institute',
})
