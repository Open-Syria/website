"""Reviewed normalization and certificate mappings for the literary/vocational source cells."""
import re
from normalize import normalize
from catalogue import text, stable_id, field_for


# Curated department-level classifications: the parent faculty's name must not
# override the actual degree (for example, law within a Sharia/law faculty).
FIELD_OVERRIDES = {
    'الإعلام والفنون التطبيقية - التصميم الغرافيكي': 'arts',
    'هندسة الذكاء الاصطناعي - الهندسة الطبية الذكية والمعلوماتية الحيوية': 'technology',
    'الشريعة والقانون - القانون': 'law',
    'الشريعة والقانون - القانون والأحوال الشخصية': 'law',
    'الشريعة والقانون - الاقتصاد الإسلامي': 'business',
    'الدراسات الإسلامية والعربية - اللغة العربية': 'languages',
}


def program_field(name):
    return FIELD_OVERRIDES.get(name, field_for(name))


def clean(value):
    value = normalize(value)
    fixes = {
        'الاإنكليزية': 'الإنكليزية', 'الإنكلي ىية': 'الإنكليزية', 'إنكلي ىية': 'إنكليزية',
        'الير بية': 'التربية', 'شر عية': 'شرعية', 'شرعيةة': 'شرعية',
        'ىف': 'في', 'العالمة': 'العلامة', 'تجار ية': 'تجارية', 'البيطر ية': 'البيطرية',
        'التبريد والتكييا': 'التبريد والتكييف', 'التص يع': 'التصنيع', 'مزدوغ': 'مزدوج',
        'النماذغ': 'النماذج', 'ال سيف': 'النسيج', 'ال سيجية': 'النسيجية', 'المالبس': 'الملابس', 'حالقة': 'حلاقة',
        'مالحة': 'ملاحة', 'آالت': 'آلات', 'الآالت': 'الآلات', 'التقانيالتقان': 'التقاني',
        'ادلب': 'إدلب', 'حماه': 'حماة', 'االعالم': 'الإعلام', 'الاعالم': 'الإعلام',
        'الحصول عىل': 'الحصول على', 'األجناية': 'الأجنبية', 'الأجناية': 'الأجنبية',
        'النجاا': 'النجاح', 'نتائف': 'نتائج', 'لالتصالات': 'للاتصالات', 'السلكية': 'اللاسلكية',
        'الير كية': 'التركية', 'الير جمة': 'الترجمة', 'للير جمة': 'للترجمة',
        'الير بوي': 'التربوي', 'عي ى': 'عين', 'الدارة': 'لإدارة',
        'الاعمال': 'الأعمال', 'الالكترونية': 'الإلكترونية',
    }
    # Only the misspelled standalone wireless label, never the wired one.
    for source, target in fixes.items(): value = value.replace(source, target)
    value = re.sub(r'\bامل', 'الم', value).replace('وامل', 'والم').replace('بامل', 'بالم')
    value = re.sub(r'\s+', ' ', value).strip()
    # Announcement 4 p6 shortens two institute names to "التقاني ...";
    # the PDF font map also moves its final ي to the start of the cell.
    value = re.sub(r'^ي (.*?) التقان$', r'المعهد التقاني \1', value)
    value = re.sub(r'(?<!\w)سلقي(?!\w)', 'سلقين', value)
    return value


CATEGORIES = {
    'industrial': text('الصناعية', 'Industrial'),
    'commercial': text('التجارية', 'Commercial'),
    'agricultural': text('الزراعية', 'Agricultural'),
    'petroleum': text('المهنية النفطية', 'Petroleum vocational'),
    'maritime': text('النقل البحري', 'Maritime transport'),
    'hospitality': text('الفندقية', 'Hospitality'),
    'women': text('المهنية النسوية', "Women's vocational"),
    'communications': text('المهنية للاتصالات', 'Telecommunications vocational'),
}

SPECIALTY_EN = {
    'تقنيات الحاسوب': 'Computer technologies', 'التبريد والتكييف': 'Refrigeration and air conditioning',
    'التصنيع الميكانيكي': 'Mechanical manufacturing', 'التقنيات الإلكترونية': 'Electronic technologies',
    'التقنيات الكهربائية': 'Electrical technologies', 'الميكاترونيكس': 'Mechatronics',
    'ميكانيك وكهرباء المركبات': 'Vehicle mechanics and electrics', 'ميكانيك المركبات': 'Vehicle mechanics',
    'التدفئة والتمديدات': 'Heating and installations', 'كهرباء صناعية': 'Industrial electricity',
    'الاتصالات': 'Communications', 'أجهزة القياس والتحكم': 'Measurement and control equipment',
    'صيانة الأجهزة الطبية': 'Medical equipment maintenance', 'اللحام وتشكيل المعادن': 'Welding and metal forming',
    'النماذج والسباكة': 'Patterns and casting', 'ملاحة بحرية': 'Marine navigation',
    'الآلات الزراعية': 'Agricultural machinery', 'ميكانيك بحري': 'Marine mechanics',
    'ميكانيك الآليات والمعدات الزراعية': 'Agricultural machinery and equipment mechanics',
    'النسيج': 'Textiles', 'صناعة الألبسة': 'Clothing production', 'خياطة الملابس': 'Garment sewing',
    'تجارية': 'Commerce', 'مطبخ': 'Kitchen', 'مطعم': 'Restaurant', 'حلاقة وتجميل': 'Hairdressing and beauty',
    'زراعية': 'Agriculture', 'البيطرية': 'Veterinary', 'نجارة الأثاث والزخرفة': 'Furniture carpentry and decoration',
    'أنظمة التشغيل والبرمجة': 'Operating systems and programming', 'الشبكات الحاسوبية': 'Computer networks',
    'البرمجة': 'Programming', 'التجهيزات الحاسوبية': 'Computer equipment', 'صيانة الحواسيب': 'Computer maintenance',
    'صيانة الحاسوب والطرفيات': 'Computer and peripheral maintenance', 'التحكم الآلي': 'Automatic control',
    'اتصالات سلكية': 'Wired communications', 'اتصالات لاسلكية': 'Wireless communications',
    'مقاسم هاتفية': 'Telephone exchanges', 'الإلكترونيات': 'Electronics',
    'إنتاج نفط وغاز': 'Oil and gas production', 'حفر آبار': 'Well drilling', 'ميكانيك آلات منجمية': 'Mining machinery mechanics',
}


def specialty_name(value):
    value = clean(value)
    value = re.sub(r'\s+', ' ', re.sub(r'[()]', '', value)).strip()
    dual = 'تعليم مزدوج' in value
    value = value.replace('تعليم مزدوج', '').strip()
    for token in ['مهن نفطية', 'النقل البحري', 'نسوية', 'سياحة', 'فندقي']:
        value = value.replace(token, '')
    value = re.sub(r'\s+', ' ', value).strip()
    aliases = {
        'تقنيات حاسوب': 'تقنيات الحاسوب', 'تقنيات إلكترونية': 'التقنيات الإلكترونية',
        'التقنيات الالكترونية': 'التقنيات الإلكترونية', 'تقنيات كهربائية': 'التقنيات الكهربائية',
        'الميكاترونكس': 'الميكاترونيكس', 'الات زراعية': 'الآلات الزراعية',
        'لحام و تشكيل معادن': 'اللحام وتشكيل المعادن', 'نماذج و سباكة': 'النماذج والسباكة',
        'اتصالات اللاسلكية': 'اتصالات لاسلكية',
    }
    value = aliases.get(value, value)
    return value + (' (تعليم مزدوج)' if dual else '')


def qualification(row):
    certificate = row['certificate']
    if row['sector'] == 'private':
        if certificate == 'كافة المهن': return None, None
        if certificate == 'الثانوية التجارية': return 'commercial', 'تجارية'
        if certificate == 'الثانوية المهنية للنقل البحري': return 'maritime', None
        if 'الصناعية مهنة ' in certificate:
            return 'industrial', specialty_name(certificate.split('مهنة ', 1)[1])
        if 'للاتصالات اختصاص ' in certificate:
            return 'communications', specialty_name(certificate.split('اختصاص ', 1)[1])
        if 'النفطية مهنة' in certificate:
            return 'petroleum', specialty_name(certificate.split(':', 1)[1])
        raise ValueError(f'Unknown private vocational certificate: {certificate}')
    profession = specialty_name(row['profession'])
    if certificate == 'المهنية بمختلف اختصاصاتها':
        assert profession == 'جميع المهن'
        return None, None
    if 'وزارة الطاقة' in certificate: return 'petroleum', profession
    if 'وزارة النقل' in certificate: return 'maritime', profession
    if 'وزارة الزراعة' in certificate: return 'agricultural', profession
    if 'وزارة السياحة' in certificate: return 'hospitality', profession
    assert 'وزارة التربية' in certificate, certificate
    if profession == 'تجارية': return 'commercial', profession
    if 'نسوية' in row['profession']: return 'women', profession
    return 'industrial', profession


def option(category, specialty):
    en = SPECIALTY_EN.get(specialty.replace(' (تعليم مزدوج)', ''))
    assert en, f'Untranslated vocational specialty: {specialty}'
    if 'تعليم مزدوج' in specialty: en += ' (dual education)'
    label = text(CATEGORIES[category]['ar']+' — '+specialty, CATEGORIES[category]['en']+' — '+en)
    if (category, specialty) in [('commercial','تجارية'), ('agricultural','زراعية')]: label = CATEGORIES[category]
    return {
        'id': category+'-'+stable_id(specialty), 'category': category,
        'name': label,
    }


def vocational_program_name(value):
    # Parentheses are reordered by the PDF font map. A separator retains their
    # grouping without reproducing stray opening/closing characters in the UI.
    name = re.sub(r'\s+', ' ', re.sub(r'[()]', '', value)).strip()
    name = name.replace('كلية التطبيقية', 'الكلية التطبيقية') if name.startswith('كلية التطبيقية') else name
    for prefix in ['الكلية التطبيقية', 'كلية الهندسة التقنية', 'المعهد التقاني الزراعي', 'المعهد التقاني للخطوط الحديدية', 'المعهد التقاني لشؤون البادية والتصحر']:
        if name.startswith(prefix+' '): return prefix+' — '+name[len(prefix):].strip()
    return name
