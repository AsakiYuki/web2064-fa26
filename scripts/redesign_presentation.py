#!/usr/bin/env python3
import zipfile
import re
import xml.etree.ElementTree as ET
import os
import subprocess

# Register namespaces
namespaces = {
    'anim': 'urn:oasis:names:tc:opendocument:xmlns:animation:1.0',
    'smil': 'urn:oasis:names:tc:opendocument:xmlns:smil-compatible:1.0',
    'presentation': 'urn:oasis:names:tc:opendocument:xmlns:presentation:1.0',
    'css3t': 'http://www.w3.org/TR/css3-text/',
    'grddl': 'http://www.w3.org/2003/g/data-view#',
    'xhtml': 'http://www.w3.org/1999/xhtml',
    'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xsd': 'http://www.w3.org/2001/XMLSchema',
    'xforms': 'http://www.w3.org/2002/xforms',
    'dom': 'http://www.w3.org/2001/xml-events',
    'script': 'urn:oasis:names:tc:opendocument:xmlns:script:1.0',
    'form': 'urn:oasis:names:tc:opendocument:xmlns:form:1.0',
    'math': 'http://www.w3.org/1998/Math/MathML',
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'ooo': 'http://openoffice.org/2004/office',
    'fo': 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0',
    'ooow': 'http://openoffice.org/2004/writer',
    'xlink': 'http://www.w3.org/1999/xlink',
    'drawooo': 'http://openoffice.org/2010/draw',
    'oooc': 'http://openoffice.org/2004/calc',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'calcext': 'urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0',
    'style': 'urn:oasis:names:tc:opendocument:xmlns:style:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
    'of': 'urn:oasis:names:tc:opendocument:xmlns:of:1.2',
    'tableooo': 'http://openoffice.org/2009/table',
    'draw': 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',
    'dr3d': 'urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0',
    'rpt': 'http://openoffice.org/2005/report',
    'formx': 'urn:openoffice:names:experimental:ooxml-odf-interop:xmlns:form:1.0',
    'svg': 'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0',
    'chart': 'urn:oasis:names:tc:opendocument:xmlns:chart:1.0',
    'officeooo': 'http://openoffice.org/2009/office',
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0'
}

for k, v in namespaces.items():
    ET.register_namespace(k, v)

def D(tag):
    return f"{{urn:oasis:names:tc:opendocument:xmlns:drawing:1.0}}{tag}"

def S(tag):
    return f"{{urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0}}{tag}"

def T(tag):
    return f"{{urn:oasis:names:tc:opendocument:xmlns:text:1.0}}{tag}"

def X(tag):
    return f"{{http://www.w3.org/1999/xlink}}{tag}"

def create_round_card(x, y, w, h, name="Card"):
    shape = ET.Element(D('custom-shape'), {
        D('name'): name,
        D('style-name'): 'gr20',
        D('text-style-name'): 'P9',
        D('layer'): 'layout',
        S('x'): x,
        S('y'): y,
        S('width'): w,
        S('height'): h
    })
    ET.SubElement(shape, T('p'))
    geom = ET.SubElement(shape, D('enhanced-geometry'), {
        D('mirror-horizontal'): 'false',
        D('mirror-vertical'): 'false',
        S('viewBox'): '0 0 0 0',
        D('glue-points'): '?f8 0 0 ?f9 ?f8 ?f10 ?f11 ?f9',
        D('text-areas'): '?f5 ?f5 ?f6 ?f7',
        D('type'): 'ooxml-roundRect',
        D('modifiers'): '5634',
        D('enhanced-path'): 'M 0 ?f2 L ?f3 0 L ?f11 ?f4 L ?f2 ?f10 Z N'
    })
    equations = [
        ('f0', 'if(0-$0 ,0,if(50000-$0 ,$0 ,50000))'),
        ('f1', 'min(logwidth,logheight)'),
        ('f2', '?f1 *?f0 /100000'),
        ('f3', 'logwidth+0-?f2 '),
        ('f4', 'logheight+0-?f2 '),
        ('f5', '?f2 *29289/100000'),
        ('f6', 'logwidth+0-?f5 '),
        ('f7', 'logheight+0-?f5 '),
        ('f8', 'logwidth/2'),
        ('f9', 'logheight/2'),
        ('f10', 'logheight'),
        ('f11', 'logwidth'),
        ('f12', '(10800000)/60000.0'),
        ('f13', '(5400000)/60000.0'),
        ('f14', '(16200000)/60000.0'),
        ('f15', '(5400000)/60000.0'),
        ('f16', '(0)/60000.0'),
        ('f17', '(5400000)/60000.0'),
        ('f18', '(5400000)/60000.0'),
        ('f19', '(5400000)/60000.0')
    ]
    for ename, eform in equations:
        ET.SubElement(geom, D('equation'), {D('name'): ename, D('formula'): eform})
    ET.SubElement(geom, D('handle'), {
        D('handle-range-x-maximum'): '50000',
        D('handle-range-x-minimum'): '0',
        D('handle-position'): '?f2 0',
        D('handle-position-x'): '?f2',
        D('handle-position-y'): '0'
    })
    return shape

def create_text_shape(style_name, text_style_name, x, y, w, h, paragraphs, name="Text"):
    shape = ET.Element(D('custom-shape'), {
        D('name'): name,
        D('style-name'): style_name,
        D('text-style-name'): text_style_name,
        D('layer'): 'layout',
        S('x'): x,
        S('y'): y,
        S('width'): w,
        S('height'): h
    })
    for p_style, spans in paragraphs:
        p_el = ET.SubElement(shape, T('p'), {T('style-name'): p_style})
        for s_style, text_val in spans:
            if s_style:
                s_el = ET.SubElement(p_el, T('span'), {T('style-name'): s_style})
                s_el.text = text_val
            else:
                p_el.text = text_val
    geom = ET.SubElement(shape, D('enhanced-geometry'), {
        D('mirror-horizontal'): 'false',
        D('mirror-vertical'): 'false',
        S('viewBox'): '0 0 0 0',
        D('glue-points'): '?f0 0 0 ?f1 ?f0 ?f2 ?f3 ?f1',
        D('text-areas'): '0 0 ?f3 ?f2',
        D('type'): 'ooxml-rect',
        D('enhanced-path'): 'M 0 0 L ?f3 0 ?f3 ?f2 0 ?f2 Z N'
    })
    for ename, eform in [('f0', 'logwidth/2'), ('f1', 'logheight/2'), ('f2', 'logheight'), ('f3', 'logwidth')]:
        ET.SubElement(geom, D('equation'), {D('name'): ename, D('formula'): eform})
    return shape

def update_presentation():
    # Use backup as base to always generate from clean source
    odp_source = 'Beta-Cinemas-Presentation.odp.bak' if os.path.exists('Beta-Cinemas-Presentation.odp.bak') else 'Beta-Cinemas-Presentation.odp'
    with zipfile.ZipFile(odp_source, 'r') as z:
        xml_data = z.read('content.xml')
        all_files = {name: z.read(name) for name in z.namelist()}

    root = ET.fromstring(xml_data)
    pages = root.findall('.//draw:page', namespaces)

    # =========================================================================
    # SLIDE 1 — PROJECT
    # =========================================================================
    p1 = pages[0]
    for el in p1:
        s = el.attrib.get(D('style-name'))
        if s == 'gr5':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = '01 · PROJECT · HỆ THỐNG BETA CINEMAS'
        elif s == 'gr7':
            el.attrib[S('height')] = '1.8cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Hệ thống website đặt vé xem phim trực tuyến hiện đại (14 trang MPA), tối ưu trải nghiệm trên Mobile & Desktop, tích hợp REST API và triển khai trên Vercel.'
        elif s == 'gr8':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'VẤN ĐỀ GIẢI QUYẾT'
        elif s == 'gr9':
            el.attrib[S('height')] = '3.6cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 7',
                D('style-name'): 'gr9',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '2.311cm',
                S('y'): '13.5cm',
                S('width'): '9.143cm',
                S('height'): '3.6cm'
            })
            p_el = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el = ET.SubElement(p_el, T('span'), {T('style-name'): 'T12'})
            s_el.text = 'Khán giả gặp bất tiện khi tra cứu lịch, rạp & chọn ghế phân tán; quy trình thanh toán phức tạp; thiếu minh bạch về giá vé, khuyến mãi và quyền lợi thành viên.'
        elif s == 'gr10':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'ĐỐI TƯỢNG SỬ DỤNG'
        elif s == 'gr11':
            el.attrib[S('height')] = '3.6cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 9',
                D('style-name'): 'gr11',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '12.598cm',
                S('y'): '13.5cm',
                S('width'): '9.143cm',
                S('height'): '3.6cm'
            })
            p_el1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el1 = ET.SubElement(p_el1, T('span'), {T('style-name'): 'T12'})
            s_el1.text = '• Khán giả xem phim: Học sinh, sinh viên, đại chúng cần trải nghiệm đặt vé nhanh chóng, tiện lợi.'
            p_el2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el2 = ET.SubElement(p_el2, T('span'), {T('style-name'): 'T12'})
            s_el2.text = '• Nhân viên & Quản trị rạp: Soát vé QR check-in tại quầy, quản lý đơn vé và giám sát KPI doanh thu.'
        elif s == 'gr12':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'THÀNH VIÊN & VAI TRÒ'
        elif s == 'gr13':
            el.attrib[S('height')] = '3.6cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 11',
                D('style-name'): 'gr13',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '22.885cm',
                S('y'): '13.5cm',
                S('width'): '9.143cm',
                S('height'): '3.6cm'
            })
            p_el1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el1 = ET.SubElement(p_el1, T('span'), {T('style-name'): 'T12'})
            s_el1.text = '• Nguyễn Văn Trọng: Leader & Architect (Core UI, Router, REST API, Bun/Vercel)'
            p_el2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el2 = ET.SubElement(p_el2, T('span'), {T('style-name'): 'T12'})
            s_el2.text = '• Vũ Tiến Lập: Frontend & QA Lead (Checkout, Bắp nước, Cụm rạp, Test 56/56)'
            p_el3 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el3 = ET.SubElement(p_el3, T('span'), {T('style-name'): 'T12'})
            s_el3.text = '• Phạm Anh Duy: Feature Integrator (Ghế & Timer 5p, Voucher, Member 3D, Admin QR)'

    # Adjust vertical red bars on slide 1
    for el in p1:
        if el.attrib.get(D('style-name')) == 'gr1' and el.attrib.get(S('width')) == '0.075cm':
            el.attrib[S('height')] = '4.0cm'

    # =========================================================================
    # SLIDE 2 — CHỨC NĂNG CHÍNH (6 CHỨC NĂNG CHÍNH, 2 ROWS OF 3 CARDS)
    # =========================================================================
    p2 = pages[1]
    header_els = []
    notes_el = None
    for el in list(p2):
        s = el.attrib.get(D('style-name'))
        tag = el.tag.split('}')[-1]
        if tag == 'notes':
            notes_el = el
        elif s in ['gr1', 'gr15', 'gr16', 'gr17', 'gr18', 'gr19']:
            header_els.append(el)

    p2.clear()
    for el in header_els:
        p2.append(el)

    for el in p2:
        s = el.attrib.get(D('style-name'))
        if s == 'gr18':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = '02 · CHỨC NĂNG CHÍNH'
        elif s == 'gr19':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Hệ thống 14 trang MPA tập trung vào các chức năng cốt lõi nhóm đã xây dựng.'

    features = [
        ('01', 'Khám phá & Trailer', 'Duyệt danh sách phim Đang chiếu & Sắp chiếu; bộ lọc tìm kiếm theo thể loại, định dạng 2D/3D; xem trailer YouTube trực tiếp trong modal.', '1.651cm', '6.9cm'),
        ('02', 'Lịch chiếu & 10 Cụm rạp', 'Tra cứu suất chiếu theo ngày và 10 cụm rạp Beta toàn quốc; lọc nhanh theo định dạng phòng chiếu (2D Lồng tiếng/Phụ đề) theo thời gian thực.', '12.014cm', '6.9cm'),
        ('03', 'Sơ đồ ghế 164 chỗ & Giữ ghế 5 phút', 'Sơ đồ 12 hàng A-M phân loại Standard, VIP, Sweetbox đôi; tự động kích hoạt đồng hồ đếm ngược giữ ghế 5 phút chống đặt trùng ghế.', '22.377cm', '6.9cm'),
        ('04', 'Combo Bắp nước & Voucher ưu đãi', 'Chọn combo bắp nước đi kèm; tự động kiểm tra điều kiện áp mã (BETA10, BETA50, SV20) và chiết khấu tổng tiền tức thì.', '1.651cm', '12.2cm'),
        ('05', 'Thanh toán mô phỏng & Xuất vé QR', 'Quy trình thanh toán mô phỏng VNPAY/MoMo/Thẻ ngân hàng; tự động sinh vé điện tử có mã QR Code định danh duy nhất phục vụ check-in.', '12.014cm', '12.2cm'),
        ('06', 'Trang Thành viên 3D & Cổng Admin', 'Thẻ hội viên hiệu ứng 3D Gyroscope/Tilt, theo dõi điểm thưởng, đổi voucher; Cổng Admin bảo mật Auth Gate, Dashboard KPI & Soát vé QR.', '22.377cm', '12.2cm')
    ]

    for num, title, desc, cx, cy in features:
        card = create_round_card(cx, cy, '9.702cm', '4.75cm', f'Card {num}')
        p2.append(card)
        num_x = f"{float(cx.replace('cm','')) + 0.508:.3f}cm"
        num_y = f"{float(cy.replace('cm','')) + 0.45:.3f}cm"
        num_shape = create_text_shape('gr21', 'P3', num_x, num_y, '1.2cm', '0.55cm', [('P2', [('T19', num)])], f'Num {num}')
        p2.append(num_shape)
        title_x = num_x
        title_y = f"{float(cy.replace('cm','')) + 1.2:.3f}cm"
        title_shape = create_text_shape('gr22', 'P3', title_x, title_y, '8.7cm', '0.75cm', [('P2', [('T22', title)])], f'Title {num}')
        p2.append(title_shape)
        desc_x = num_x
        desc_y = f"{float(cy.replace('cm','')) + 2.1:.3f}cm"
        desc_shape = create_text_shape('gr23', 'P3', desc_x, desc_y, '8.7cm', '2.3cm', [('P2', [('T16', desc)])], f'Desc {num}')
        p2.append(desc_shape)

    if notes_el is not None:
        p2.append(notes_el)

    # =========================================================================
    # SLIDE 3 — MVP (MUST HAVE, ĐÃ HOÀN THÀNH, CHƯA HOÀN THÀNH, ĐÃ CẮT KHỎI SCOPE)
    # =========================================================================
    p3 = pages[2]
    header_els_p3 = []
    notes_el_p3 = None
    for el in list(p3):
        s = el.attrib.get(D('style-name'))
        tag = el.tag.split('}')[-1]
        if tag == 'notes':
            notes_el_p3 = el
        elif s in ['gr1', 'gr48', 'gr49', 'gr50', 'gr51', 'gr52']:
            header_els_p3.append(el)

    p3.clear()
    for el in header_els_p3:
        p3.append(el)

    for el in p3:
        s = el.attrib.get(D('style-name'))
        if s == 'gr51':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = '03 · MVP (MINIMUM VIABLE PRODUCT)'
        elif s == 'gr52':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Đánh giá phạm vi MVP: Yêu cầu cốt lõi, mức độ hoàn thiện và định hướng scope.'

    # 1. MUST HAVE (Top-Left: 1.651cm, 6.8cm, 14.858cm, 4.4cm)
    card_must = create_round_card('1.651cm', '6.8cm', '14.858cm', '4.4cm', 'Card Must Have')
    p3.append(card_must)
    text_must_title = create_text_shape('gr53', 'P3', '2.261cm', '7.15cm', '13.639cm', '0.65cm', [
        ('P2', [('T14', '1. MUST HAVE (YÊU CẦU CỐT LÕI)')])
    ], 'Title Must Have')
    p3.append(text_must_title)
    text_must_body = create_text_shape('gr55', 'P3', '2.261cm', '7.95cm', '13.639cm', '3.1cm', [
        ('P2', [('T15', '• '), ('T16', 'Luồng đặt vé khép kín: Chọn phim → suất chiếu → chọn ghế → bắp nước → thanh toán → nhận vé điện tử.')]),
        ('P2', [('T15', '• '), ('T16', 'Sơ đồ 164 ghế trực quan, cơ chế giữ ghế chống đặt trùng thời gian thực.')]),
        ('P2', [('T15', '• '), ('T16', 'Xuất vé mã QR Code động phục vụ xác thực check-in tại quầy rạp.')]),
        ('P2', [('T15', '• '), ('T16', 'Quản lý tài khoản, tích lũy điểm thưởng và bảo vệ cổng quản trị Admin.')])
    ], 'Body Must Have')
    p3.append(text_must_body)

    # 2. ĐÃ HOÀN THÀNH GÌ? (Bottom-Left: 1.651cm, 11.45cm, 14.858cm, 4.5cm)
    card_done = create_round_card('1.651cm', '11.45cm', '14.858cm', '4.5cm', 'Card Completed')
    p3.append(card_done)
    text_done_title = create_text_shape('gr53', 'P3', '2.261cm', '11.75cm', '13.639cm', '0.65cm', [
        ('P2', [('T14', '2. ĐÃ HOÀN THÀNH GÌ? (100% CAM KẾT)')])
    ], 'Title Completed')
    p3.append(text_done_title)
    text_done_body = create_text_shape('gr55', 'P3', '2.261cm', '12.55cm', '13.639cm', '3.2cm', [
        ('P2', [('T15', '• '), ('T16', 'Hoàn thiện 14/14 trang MPA: Home, Movies, Detail, Schedule, Cinemas, Pricing, News, Booking, Checkout, Member, Profile, Admin, 404, Error.')]),
        ('P2', [('T15', '• '), ('T16', 'Cơ chế giữ ghế 5 phút tự động hủy; hệ thống voucher kiểm tra minOrder/maxCap.')]),
        ('P2', [('T15', '• '), ('T16', 'Trang Thành Viên thẻ 3D interactive, đổi quà; Cổng Admin Dashboard & Soát vé QR.')]),
        ('P2', [('T15', '• '), ('T16', 'Bộ kiểm thử 56/56 automated use cases PASS 100%; build MPA nhanh ~744ms.')])
    ], 'Body Completed')
    p3.append(text_done_body)

    # 3. CHƯA HOÀN THÀNH GÌ? (Top-Right: 17.323cm, 6.8cm, 14.858cm, 4.4cm)
    card_pending = create_round_card('17.323cm', '6.8cm', '14.858cm', '4.4cm', 'Card Pending')
    p3.append(card_pending)
    text_pending_title = create_text_shape('gr64', 'P3', '17.932cm', '7.15cm', '13.639cm', '0.65cm', [
        ('P2', [('T14', '3. CHƯA HOÀN THÀNH GÌ? (HẠN CHẾ DEMO)')])
    ], 'Title Pending')
    p3.append(text_pending_title)
    text_pending_body = create_text_shape('gr66', 'P3', '17.932cm', '7.95cm', '13.639cm', '3.1cm', [
        ('P2', [('T15', '• '), ('T16', 'Cổng thanh toán trực tiếp ngân hàng thật: Hiện tại là mô phỏng do cần tư cách pháp nhân ký hợp đồng thương mại với VNPAY/MoMo thực tế.')]),
        ('P2', [('T15', '• '), ('T16', 'Gửi vé tự động qua SMS Brandname / Zalo ZNS: Cần đăng ký tên định danh viễn thông và chi phí duy trì dịch vụ SMS gateway.')]),
        ('P2', [('T15', '• '), ('T16', 'Đồng bộ phòng chiếu đa server: Sử dụng REST API tập trung, chưa phân tán microservices.')])
    ], 'Body Pending')
    p3.append(text_pending_body)

    # 4. NHỮNG GÌ ĐÃ CẮT KHỎI SCOPE (Bottom-Right: 17.323cm, 11.45cm, 14.858cm, 4.5cm)
    card_scoped = create_round_card('17.323cm', '11.45cm', '14.858cm', '4.5cm', 'Card Scoped Out')
    p3.append(card_scoped)
    text_scoped_title = create_text_shape('gr64', 'P3', '17.932cm', '11.75cm', '13.639cm', '0.65cm', [
        ('P2', [('T14', '4. NHỮNG GÌ ĐÃ CẮT KHỎI SCOPE (TỐI ƯU MVP)')])
    ], 'Title Scoped Out')
    p3.append(text_scoped_title)
    text_scoped_body = create_text_shape('gr66', 'P3', '17.932cm', '12.55cm', '13.639cm', '3.2cm', [
        ('P2', [('T15', '• '), ('T16', 'Đặt vé theo nhóm & chia tiền (Split-bill): Cắt giảm để ưu tiên tối đa cho luồng cá nhân đặt vé nhanh, mượt mà và chống nghẽn thao tác.')]),
        ('P2', [('T15', '• '), ('T16', 'Đặt trước dịch vụ xe đưa đón đến rạp: Cắt khỏi scope vì không thuộc nghiệp vụ cốt lõi của website rạp phim.')]),
        ('P2', [('T15', '• '), ('T16', 'Mạng xã hội bình luận đa cấp: Thay thế bằng trailer YouTube và đánh giá trực quan để hệ thống vận hành nhẹ nhàng, tránh spam.')])
    ], 'Body Scoped Out')
    p3.append(text_scoped_body)

    # Footer banner
    footer = create_text_shape('gr72', 'P3', '1.829cm', '16.307cm', '30.225cm', '0.761cm', [
        ('P2', [('T18', 'Hệ thống hoàn thành 100% mục tiêu MVP cốt lõi, chuẩn kiến trúc MPA, sẵn sàng demo và đưa vào sử dụng.')])
    ], 'Footer MVP')
    p3.append(footer)

    if notes_el_p3 is not None:
        p3.append(notes_el_p3)

    # =========================================================================
    # SLIDE 4 — SOLUTION
    # =========================================================================
    p4 = pages[3]
    for el in p4:
        s = el.attrib.get(D('style-name'))
        if s == 'gr76':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = '04 · SOLUTION'
        elif s == 'gr77':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Kiến trúc hiện đại kết hợp Vite MPA, Bun Runtime, REST API và Vercel.'
        elif s == 'gr79':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Giao diện 14 trang (MPA), SCSS module hóa, responsive chuẩn Mobile/PC'
        elif s == 'gr81':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Logic thuần không phụ thuộc framework, xử lý luồng đặt vé cực mượt, runtime Bun siêu tốc'
        elif s == 'gr83':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'REST API: movies, showtimes, cinemas, concessions, vouchers, bookings'
        elif s == 'gr85':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Auth JWT token, mã hóa bcrypt, đăng nhập Email/SĐT, phân quyền User/Admin'
        elif s == 'gr86':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'CÁC MODULE CHÍNH (14 TRANG MPA)'
        elif s == 'gr87':
            el.attrib[S('height')] = '1.8cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 18',
                D('style-name'): 'gr87',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '14.097cm',
                S('y'): '7.798cm',
                S('width'): '17.398cm',
                S('height'): '1.8cm'
            })
            p_el1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el1 = ET.SubElement(p_el1, T('span'), {T('style-name'): 'T12'})
            s_el1.text = '• Khách hàng: Home · movies · movie-detail · schedule · cinemas · pricing · news · booking · checkout · member · profile.'
            p_el2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el2 = ET.SubElement(p_el2, T('span'), {T('style-name'): 'T12'})
            s_el2.text = '• Quản trị & Tiện ích: admin (Cổng quản lý & Soát vé) · 404 (Not Found) · error (Error Handler).'
        elif s == 'gr89':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'DATA & REST API CHÍNH (DB.JSON TẬP TRUNG)'
        elif s == 'gr90':
            el.attrib[S('height')] = '1.8cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 20',
                D('style-name'): 'gr90',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '14.097cm',
                S('y'): '10.668cm',
                S('width'): '17.398cm',
                S('height'): '1.8cm'
            })
            p_el1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el1 = ET.SubElement(p_el1, T('span'), {T('style-name'): 'T12'})
            s_el1.text = '• Thực thể: movies (11 phim) · cinemas (10 rạp) · showtimes · concessions · vouchers · bookings · users.'
            p_el2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el2 = ET.SubElement(p_el2, T('span'), {T('style-name'): 'T12'})
            s_el2.text = '• Endpoints: GET/POST/PATCH/DELETE kết hợp lớp api.js và storage.js đồng bộ client & serverless.'
        elif s == 'gr91':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'LOGIN & ADMIN PORTAL (TRÌNH BÀY NGẮN)'
        elif s == 'gr92':
            el.attrib[S('height')] = '1.8cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 22',
                D('style-name'): 'gr92',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '14.097cm',
                S('y'): '13.538cm',
                S('width'): '17.398cm',
                S('height'): '1.8cm'
            })
            p_el1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el1 = ET.SubElement(p_el1, T('span'), {T('style-name'): 'T12'})
            s_el1.text = '• Phân quyền tài khoản (User / Admin) bảo vệ bởi Auth Gate và JWT Token an toàn.'
            p_el2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el2 = ET.SubElement(p_el2, T('span'), {T('style-name'): 'T12'})
            s_el2.text = '• Cổng Admin: Dashboard giám sát doanh thu & đơn vé, công cụ Soát vé QR trực tiếp bằng camera/mã vé.'

    # =========================================================================
    # SLIDE 5 — DEMO
    # =========================================================================
    p5 = pages[4]
    # Check if right background card exists, if not add it
    has_right_card = any(el.attrib.get(D('name')) == 'Card Demo Right' for el in p5)
    if not has_right_card:
        card_demo_right = create_round_card('21.0cm', '10.7cm', '11.0cm', '5.5cm', 'Card Demo Right')
        # Insert before gr108
        idx_108 = -1
        for idx, el in enumerate(p5):
            if el.attrib.get(D('style-name')) == 'gr108':
                idx_108 = idx
                break
        if idx_108 >= 0:
            p5.insert(idx_108, card_demo_right)
        else:
            p5.append(card_demo_right)

    for el in p5:
        s = el.attrib.get(D('style-name'))
        if s == 'gr96':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = '05 · DEMO · HAPPY PATH 3–5 PHÚT'
        elif s == 'gr97':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Kịch bản demo tinh gọn, tập trung luồng đặt vé chính và minh chứng MVP chạy thực tế.'
        elif s == 'gr99':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Khám phá & Chọn suất: Duyệt phim Đang chiếu tại Trang chủ/Phim, xem trailer YouTube modal, chọn cụm rạp và suất chiếu.'
        elif s == 'gr101':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Chọn ghế & Giữ chỗ 5 phút: Chọn ghế Standard/VIP/Sweetbox trên sơ đồ 164 chỗ; kích hoạt đồng hồ đếm ngược 5 phút chống đặt trùng.'
        elif s == 'gr103':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Thêm combo bắp nước & Áp Voucher: Chọn combo bắp nước, áp mã ưu đãi (BETA10/BETA50/SV20); tự động kiểm tra điều kiện & chiết khấu.'
        elif s == 'gr105':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Xác nhận & Xuất vé QR: Điền thông tin, thanh toán mô phỏng thành công; nhận ngay Vé điện tử tích hợp mã QR Code check-in.'
        elif s == 'gr108':
            el.attrib[S('height')] = '5.0cm'
            el.attrib[S('width')] = '10.2cm'
            el.attrib[S('x')] = '21.4cm'
            el.attrib[S('y')] = '10.9cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 31',
                D('style-name'): 'gr108',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '21.4cm',
                S('y'): '10.9cm',
                S('width'): '10.2cm',
                S('height'): '5.0cm'
            })
            p1_title = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s1_title = ET.SubElement(p1_title, T('span'), {T('style-name'): 'T19'})
            s1_title.text = 'CHỨC NĂNG NỔI BẬT DEMO THÊM:'
            
            p1_b1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s1_b1 = ET.SubElement(p1_b1, T('span'), {T('style-name'): 'T18'})
            s1_b1.text = '• Trang Thành Viên: Trải nghiệm thẻ 3D interactive, xem điểm thưởng tích lũy và đổi voucher trực tiếp.'

            p1_b2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s1_b2 = ET.SubElement(p1_b2, T('span'), {T('style-name'): 'T18'})
            s1_b2.text = '• Cổng Admin: Đăng nhập quản trị, xem Dashboard KPI doanh thu và quét mã QR vé vừa tạo để xác nhận Check-in.'

            p_sp = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})

            p2_title = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s2_title = ET.SubElement(p2_title, T('span'), {T('style-name'): 'T19'})
            s2_title.text = 'CHỨNG MINH MVP THỰC SỰ CHẠY:'

            p2_b1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s2_b1 = ET.SubElement(p2_b1, T('span'), {T('style-name'): 'T18'})
            s2_b1.text = '• 100% 56/56 automated test cases PASS (Auth, Booking, Timer 5p, Vouchers, Points, Error 400/404).'

            p2_b2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s2_b2 = ET.SubElement(p2_b2, T('span'), {T('style-name'): 'T18'})
            s2_b2.text = '• Build MPA nhanh ~744ms, server Bun & Vite chạy ổn định mượt mà.'

    # =========================================================================
    # SLIDE 6 — TEAM & GIT
    # =========================================================================
    p6 = pages[5]
    # Enlarge cards to 9.7cm height
    for el in p6:
        if el.attrib.get(D('style-name')) == 'gr20':
            el.attrib[S('height')] = '9.7cm'

    for el in p6:
        s = el.attrib.get(D('style-name'))
        if s == 'gr112':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = '06 · TEAM & GIT'
        elif s == 'gr113':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Phân công nhiệm vụ rõ ràng, quản lý mã nguồn chặt chẽ và định hướng phát triển.'
        elif s == 'gr114':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'AI LÀM GÌ & ĐÓNG GÓP TỪNG THÀNH VIÊN'
        elif s == 'gr116':
            el.attrib[S('height')] = '1.75cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Nguyễn Văn Trọng — Leader & Architect: Thiết kế cấu trúc 14 trang MPA, Router & REST API json-server, Bun runtime, tối ưu build & Vercel deployment.'
        elif s == 'gr118':
            el.attrib[S('height')] = '1.75cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Vũ Tiến Lập — Frontend & QA Lead: Phát triển module Checkout, combo bắp nước, bảng giá vé (pricing), tin tức (news), Cụm rạp (cinemas), bộ kiểm thử tự động 56 use cases.'
        elif s == 'gr120':
            el.attrib[S('height')] = '1.75cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Phạm Anh Duy — Feature Lead & Integrator: Sơ đồ 164 ghế & đếm ngược giữ ghế 5 phút, hệ thống Voucher giảm giá, Trang Thành Viên thẻ 3D, Cổng Admin & Soát vé QR.'
        elif s == 'gr122':
            el.clear()
            el.attrib.update({
                D('name'): 'Text 15',
                D('style-name'): 'gr122',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '2.54cm',
                S('y'): '15.037cm',
                S('width'): '13.207cm',
                S('height'): '0.634cm'
            })
            p_el = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_link = ET.SubElement(p_el, T('span'), {T('style-name'): 'T27'})
            a_el = ET.SubElement(s_link, T('a'), {
                X('href'): 'https://github.com/AsakiYuki/web2064-fa26',
                X('type'): 'simple'
            })
            a_el.text = 'github.com/AsakiYuki/web2064-fa26'
            s_note = ET.SubElement(p_el, T('span'), {T('style-name'): 'T18'})
            s_note.text = ' (Conventional Commits, 100% mã nguồn)'
        elif s == 'gr123' and el.attrib.get(D('name')) != 'Title Next Steps':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'KHÓ KHĂN LỚN NHẤT & CÁCH GIẢI QUYẾT'
        elif s == 'gr125' and el.attrib.get(D('name')) != 'Body Next Steps':
            el.attrib[S('height')] = '1.75cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Khó khăn lớn nhất: Đồng bộ trạng thái giữ ghế thời gian thực (5-min hold) và dữ liệu đơn vé giữa REST API json-server, client LocalStorage và môi trường Serverless (Vercel read-only filesystem).'
        elif s == 'gr127':
            el.attrib[S('height')] = '1.75cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Cách giải quyết: Thiết kế kiến trúc Hybrid Storage (api.js + storage.js) tự động chuyển đổi linh hoạt kèm cơ chế sao chép cơ sở dữ liệu tạm vào thư mục /tmp trên Vercel.'

    # Add Next Steps on Right Card of Slide 6 if not already added
    has_next_steps = any(el.attrib.get(D('name')) == 'Title Next Steps' for el in p6)
    if not has_next_steps:
        text_next_steps_title = create_text_shape('gr123', 'P3', '18.263cm', '12.5cm', '13.309cm', '0.65cm', [
            ('P2', [('T14', 'KẾ HOẠCH GIAI ĐOẠN TIẾP THEO')])
        ], 'Title Next Steps')
        p6.append(text_next_steps_title)

        text_next_steps_body = create_text_shape('gr125', 'P3', '18.263cm', '13.25cm', '13.309cm', '2.5cm', [
            ('P2', [('T15', '• '), ('T16', 'Tích hợp cổng thanh toán trực tiếp qua Webhook thực tế từ VNPAY / MoMo merchant.')]),
            ('P2', [('T15', '• '), ('T16', 'Phát triển ứng dụng di động đa nền tảng (PWA / Mobile App) và tự động gửi vé qua Zalo ZNS / SMS.')]),
            ('P2', [('T15', '• '), ('T16', 'Nâng cấp hệ thống Admin: Quản lý động sơ đồ phòng chiếu và thiết lập chiến dịch ưu đãi theo khung giờ vàng.')])
        ], 'Body Next Steps')
        p6.append(text_next_steps_body)

    # Re-insert notes element at the end of Slide 6
    notes_p6 = None
    for el in list(p6):
        if el.tag.split('}')[-1] == 'notes':
            notes_p6 = el
            p6.remove(el)
            break
    if notes_p6 is not None:
        p6.append(notes_p6)

    # Save content.xml and update zip
    new_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    all_files['content.xml'] = new_xml

    odp_dest = 'Beta-Cinemas-Presentation.odp'
    with zipfile.ZipFile(odp_dest, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name, data in all_files.items():
            z.writestr(name, data)

    print("Beta-Cinemas-Presentation.odp updated successfully!")

if __name__ == '__main__':
    update_presentation()
