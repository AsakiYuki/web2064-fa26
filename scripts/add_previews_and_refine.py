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

def create_image_frame(name, href, x, y, w, h, style_name="gr20"):
    frame = ET.Element(D('frame'), {
        D('name'): name,
        D('style-name'): style_name,
        D('layer'): 'layout',
        S('x'): x,
        S('y'): y,
        S('width'): w,
        S('height'): h
    })
    ET.SubElement(frame, D('image'), {
        X('href'): href,
        X('type'): 'simple',
        X('show'): 'embed',
        X('actuate'): 'onLoad'
    })
    return frame

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

def refine_presentation():
    odp_path = 'Beta-Cinemas-Presentation.odp'
    with zipfile.ZipFile(odp_path, 'r') as z:
        all_files = {name: z.read(name) for name in z.namelist()}

    # Update Manifest to register embedded images
    manifest_xml = all_files['META-INF/manifest.xml'].decode('utf-8')
    images_to_register = [
        ('Pictures/preview_home.png', 'preview_home_opt.png'),
        ('Pictures/preview_booking.png', 'preview_booking_opt.png'),
        ('Pictures/preview_admin.png', 'preview_admin_opt.png')
    ]
    for pic_path, local_file in images_to_register:
        if os.path.exists(local_file):
            with open(local_file, 'rb') as f:
                all_files[pic_path] = f.read()
            if pic_path not in manifest_xml:
                entry = f' <manifest:file-entry manifest:full-path="{pic_path}" manifest:media-type="image/png"/>\n</manifest:manifest>'
                manifest_xml = manifest_xml.replace('</manifest:manifest>', entry)

    all_files['META-INF/manifest.xml'] = manifest_xml.encode('utf-8')

    root = ET.fromstring(all_files['content.xml'])
    pages = root.findall('.//draw:page', namespaces)

    # =========================================================================
    # SLIDE 1 — PROJECT (Thêm ảnh preview trang chủ + Bớt chữ xúc tích)
    # =========================================================================
    p1 = pages[0]
    # Header & Left layout adjustments
    for el in p1:
        s = el.attrib.get(D('style-name'))
        if s == 'gr5':
            el.attrib[S('width')] = '15.0cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = '01 · PROJECT · HỆ THỐNG BETA CINEMAS'
        elif s == 'gr6':
            el.attrib[S('width')] = '15.0cm'
            el.attrib[S('height')] = '2.8cm'
        elif s == 'gr7':
            el.attrib[S('y')] = '7.5cm'
            el.attrib[S('width')] = '15.0cm'
            el.attrib[S('height')] = '2.2cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Nền tảng đặt vé xem phim trực tuyến hiện đại (14 trang MPA), tối ưu Mobile & Desktop, tích hợp REST API và triển khai trên Vercel.'
        elif s == 'gr8':
            el.attrib[S('y')] = '12.5cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'VẤN ĐỀ GIẢI QUYẾT'
        elif s == 'gr9':
            el.attrib[S('y')] = '13.2cm'
            el.attrib[S('height')] = '3.0cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 7',
                D('style-name'): 'gr9',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '2.311cm',
                S('y'): '13.2cm',
                S('width'): '9.143cm',
                S('height'): '3.0cm'
            })
            p_el1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el1 = ET.SubElement(p_el1, T('span'), {T('style-name'): 'T12'})
            s_el1.text = '• Tra cứu lịch, rạp & chọn ghế còn phân tán.'
            p_el2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el2 = ET.SubElement(p_el2, T('span'), {T('style-name'): 'T12'})
            s_el2.text = '• Thanh toán rườm rà, thiếu minh bạch ưu đãi & điểm thành viên.'
        elif s == 'gr10':
            el.attrib[S('y')] = '12.5cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'ĐỐI TƯỢNG SỬ DỤNG'
        elif s == 'gr11':
            el.attrib[S('y')] = '13.2cm'
            el.attrib[S('height')] = '3.0cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 9',
                D('style-name'): 'gr11',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '12.598cm',
                S('y'): '13.2cm',
                S('width'): '9.143cm',
                S('height'): '3.0cm'
            })
            p_el1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el1 = ET.SubElement(p_el1, T('span'), {T('style-name'): 'T12'})
            s_el1.text = '• Khán giả: Học sinh, sinh viên, người yêu điện ảnh cần đặt vé nhanh.'
            p_el2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el2 = ET.SubElement(p_el2, T('span'), {T('style-name'): 'T12'})
            s_el2.text = '• Nhân viên rạp: Soát vé QR check-in tại quầy & theo dõi doanh thu.'
        elif s == 'gr12':
            el.attrib[S('y')] = '12.5cm'
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'THÀNH VIÊN & VAI TRÒ'
        elif s == 'gr13':
            el.attrib[S('y')] = '13.2cm'
            el.attrib[S('height')] = '3.0cm'
            el.clear()
            el.attrib.update({
                D('name'): 'Text 11',
                D('style-name'): 'gr13',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '22.885cm',
                S('y'): '13.2cm',
                S('width'): '9.143cm',
                S('height'): '3.0cm'
            })
            p_el1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el1 = ET.SubElement(p_el1, T('span'), {T('style-name'): 'T12'})
            s_el1.text = '• Nguyễn Văn Trọng: Leader & Architect (UI, Router, API, Vercel)'
            p_el2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el2 = ET.SubElement(p_el2, T('span'), {T('style-name'): 'T12'})
            s_el2.text = '• Vũ Tiến Lập: Frontend & QA Lead (Checkout, Rạp, Test 56/56)'
            p_el3 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            s_el3 = ET.SubElement(p_el3, T('span'), {T('style-name'): 'T12'})
            s_el3.text = '• Phạm Anh Duy: Feature Lead (Ghế 164, Voucher, Member 3D, Admin)'

    # Adjust red bars on slide 1
    for el in p1:
        if el.attrib.get(D('style-name')) == 'gr1' and el.attrib.get(S('width')) == '0.075cm':
            el.attrib[S('y')] = '12.5cm'
            el.attrib[S('height')] = '3.5cm'

    # Add Preview Image of Home page on Slide 1 top right
    has_p1_img = any(el.attrib.get(D('name')) == 'PreviewHome' for el in p1)
    if not has_p1_img:
        # Card background for image
        card_p1_img = create_round_card('17.5cm', '3.2cm', '14.8cm', '8.4cm', 'CardPreviewHome')
        p1.append(card_p1_img)
        frame_home = create_image_frame('PreviewHome', 'Pictures/preview_home.png', '17.8cm', '3.45cm', '14.2cm', '7.9cm')
        p1.append(frame_home)

    # Re-insert notes element at the end of Slide 1
    notes_p1 = None
    for el in list(p1):
        if el.tag.split('}')[-1] == 'notes':
            notes_p1 = el
            p1.remove(el)
            break
    if notes_p1 is not None:
        p1.append(notes_p1)

    # =========================================================================
    # SLIDE 2 — CHỨC NĂNG CHÍNH (Bớt chữ, súc tích hơn)
    # =========================================================================
    p2 = pages[1]
    features_short = [
        ('01', 'Khám phá & Trailer', 'Duyệt phim Đang chiếu & Sắp chiếu; bộ lọc tìm kiếm theo thể loại & 2D/3D; xem trailer YouTube modal trực tiếp.'),
        ('02', 'Lịch chiếu & 10 Cụm rạp', 'Tra cứu suất chiếu theo ngày tại 10 rạp Beta toàn quốc; lọc nhanh theo định dạng phòng chiếu (2D Lồng tiếng/Phụ đề).'),
        ('03', 'Sơ đồ 164 ghế & Giữ ghế 5p', '12 hàng ghế A-M (Standard, VIP, Sweetbox đôi); tự động kích hoạt đếm ngược 5 phút chống đặt trùng ghế.'),
        ('04', 'Combo Bắp nước & Voucher', 'Chọn combo bắp nước đi kèm; tự động kiểm tra điều kiện áp mã (BETA10, BETA50, SV20) và chiết khấu tức thì.'),
        ('05', 'Thanh toán & Xuất vé QR', 'Thanh toán mô phỏng VNPAY/MoMo/Thẻ ngân hàng; tự động sinh vé điện tử có mã QR Code check-in tại quầy.'),
        ('06', 'Thành viên 3D & Cổng Admin', 'Thẻ hội viên 3D interactive, đổi voucher bằng điểm; Cổng Admin bảo mật Auth Gate, Dashboard KPI & Soát vé QR.')
    ]

    for idx, (num, title, desc) in enumerate(features_short):
        for el in p2:
            if el.attrib.get(D('name')) == f'Desc {num}':
                for p in el.findall('.//text:p', namespaces):
                    for span in p.findall('.//text:span', namespaces):
                        span.text = desc

    # =========================================================================
    # SLIDE 3 — MVP (Bớt chữ, ngắn gọn, súc tích)
    # =========================================================================
    p3 = pages[2]
    for el in p3:
        name = el.attrib.get(D('name'), '')
        if name == 'Body Must Have':
            el.clear()
            el.attrib.update({
                D('name'): 'Body Must Have',
                D('style-name'): 'gr55',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '2.261cm',
                S('y'): '7.95cm',
                S('width'): '13.639cm',
                S('height'): '3.1cm'
            })
            p1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p1, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p1, T('span'), {T('style-name'): 'T16'}).text = 'Luồng đặt vé khép kín: Chọn phim → suất → ghế → bắp nước → vé QR.'
            p2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p2, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p2, T('span'), {T('style-name'): 'T16'}).text = 'Sơ đồ 164 ghế trực quan, giữ chỗ 5 phút chống đặt trùng thời gian thực.'
            p3_sub = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T16'}).text = 'Tài khoản hội viên & bảo mật Cổng quản trị Admin bằng JWT Token.'

        elif name == 'Body Completed':
            el.clear()
            el.attrib.update({
                D('name'): 'Body Completed',
                D('style-name'): 'gr55',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '2.261cm',
                S('y'): '12.55cm',
                S('width'): '13.639cm',
                S('height'): '3.2cm'
            })
            p1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p1, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p1, T('span'), {T('style-name'): 'T16'}).text = '14/14 trang MPA hoàn thiện, responsive mượt mà Desktop & Mobile.'
            p2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p2, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p2, T('span'), {T('style-name'): 'T16'}).text = 'Giữ ghế 5 phút, áp mã voucher, thẻ thành viên 3D, soát vé QR tức thì.'
            p3_sub = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T16'}).text = 'Bộ test tự động 56/56 Use Cases & Ngoại lệ PASS 100%; build nhanh ~740ms.'

        elif name == 'Body Pending':
            el.clear()
            el.attrib.update({
                D('name'): 'Body Pending',
                D('style-name'): 'gr66',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '17.932cm',
                S('y'): '7.95cm',
                S('width'): '13.639cm',
                S('height'): '3.1cm'
            })
            p1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p1, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p1, T('span'), {T('style-name'): 'T16'}).text = 'Cổng thanh toán ngân hàng thật (cần tư cách pháp nhân ký hợp đồng VNPAY).'
            p2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p2, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p2, T('span'), {T('style-name'): 'T16'}).text = 'Gửi vé tự động SMS Brandname / Zalo ZNS (yêu cầu chi phí viễn thông).'
            p3_sub = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T16'}).text = 'Đồng bộ phòng chiếu đa server (hiện sử dụng REST API tập trung).'

        elif name == 'Body Scoped Out':
            el.clear()
            el.attrib.update({
                D('name'): 'Body Scoped Out',
                D('style-name'): 'gr66',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '17.932cm',
                S('y'): '12.55cm',
                S('width'): '13.639cm',
                S('height'): '3.2cm'
            })
            p1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p1, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p1, T('span'), {T('style-name'): 'T16'}).text = 'Đặt vé theo nhóm chia tiền (Split-bill): Cắt để ưu tiên luồng đặt vé nhanh.'
            p2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p2, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p2, T('span'), {T('style-name'): 'T16'}).text = 'Đặt trước xe đưa đón rạp: Cắt vì không thuộc nghiệp vụ cốt lõi rạp phim.'
            p3_sub = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T16'}).text = 'Mạng xã hội bình luận đa cấp: Thay bằng trailer YouTube & đánh giá trực tiếp.'

    # =========================================================================
    # SLIDE 4 — SOLUTION (Bớt chữ + Preview Admin Portal)
    # =========================================================================
    p4 = pages[3]
    for el in p4:
        s = el.attrib.get(D('style-name'))
        if s == 'gr79':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = '14 trang MPA, SCSS module hóa, responsive Mobile & PC.'
        elif s == 'gr81':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Logic thuần mượt mà, không phụ thuộc framework, runtime Bun.'
        elif s == 'gr83':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'REST API CRUD: movies, showtimes, cinemas, concessions, bookings.'
        elif s == 'gr85':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'JWT Token, mã hóa bcrypt, đăng nhập Email/SĐT, phân quyền.'
        elif s == 'gr87':
            el.clear()
            el.attrib.update({
                D('name'): 'Text 18',
                D('style-name'): 'gr87',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '14.097cm',
                S('y'): '7.798cm',
                S('width'): '17.398cm',
                S('height'): '1.5cm'
            })
            p1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p1, T('span'), {T('style-name'): 'T12'}).text = '• Khách hàng: Home · movies · detail · schedule · cinemas · pricing · news · booking · checkout · member · profile.'
            p2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p2, T('span'), {T('style-name'): 'T12'}).text = '• Quản trị & Tiện ích: admin (Dashboard & Soát vé QR) · 404 · error.'
        elif s == 'gr90':
            el.clear()
            el.attrib.update({
                D('name'): 'Text 20',
                D('style-name'): 'gr90',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '14.097cm',
                S('y'): '10.668cm',
                S('width'): '17.398cm',
                S('height'): '1.5cm'
            })
            p1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p1, T('span'), {T('style-name'): 'T12'}).text = '• Thực thể: movies (11 phim) · cinemas (10 rạp) · showtimes · concessions · vouchers · bookings · users.'
            p2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p2, T('span'), {T('style-name'): 'T12'}).text = '• Đồng bộ: api.js + storage.js đa tầng (REST API json-server + LocalStorage fallback).'
        elif s == 'gr92':
            el.clear()
            el.attrib.update({
                D('name'): 'Text 22',
                D('style-name'): 'gr92',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '14.097cm',
                S('y'): '13.538cm',
                S('width'): '9.8cm',
                S('height'): '2.8cm'
            })
            p1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p1, T('span'), {T('style-name'): 'T12'}).text = '• Phân quyền tài khoản User / Admin với JWT token.'
            p2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p2, T('span'), {T('style-name'): 'T12'}).text = '• Dashboard KPI doanh thu & công cụ Soát vé QR tức thì.'

    # Add Admin Preview Image on Slide 4 bottom right
    has_p4_img = any(el.attrib.get(D('name')) == 'PreviewAdmin' for el in p4)
    if not has_p4_img:
        card_p4_img = create_round_card('24.2cm', '12.5cm', '7.4cm', '4.4cm', 'CardPreviewAdmin')
        p4.append(card_p4_img)
        frame_admin = create_image_frame('PreviewAdmin', 'Pictures/preview_admin.png', '24.35cm', '12.65cm', '7.1cm', '4.1cm')
        p4.append(frame_admin)

    notes_p4 = None
    for el in list(p4):
        if el.tag.split('}')[-1] == 'notes':
            notes_p4 = el
            p4.remove(el)
            break
    if notes_p4 is not None:
        p4.append(notes_p4)

    # =========================================================================
    # SLIDE 5 — DEMO (Bớt chữ + Preview Sơ đồ 164 ghế thực tế & Giữ chỗ 5p)
    # =========================================================================
    p5 = pages[4]
    for el in p5:
        s = el.attrib.get(D('style-name'))
        if s == 'gr99':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Khám phá & Chọn suất: Xem phim đang chiếu, mở trailer YouTube, chọn rạp và suất chiếu.'
        elif s == 'gr101':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Chọn ghế & Giữ chỗ 5p: Chọn ghế trên sơ đồ 164 chỗ; kích hoạt đếm ngược 5 phút chống trùng.'
        elif s == 'gr103':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Bắp nước & Áp Voucher: Chọn combo bắp nước, áp mã (BETA10/BETA50/SV20) tự động chiết khấu.'
        elif s == 'gr105':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Thanh toán & Xuất vé QR: Xác nhận thanh toán mô phỏng; sinh ngay Vé điện tử có mã QR check-in.'

    # On right side of Slide 5:
    # Remove old gr108 text box and replace with:
    # 1. Preview Booking Image Frame (shows 164 seatmap + countdown timer!)
    # 2. Concise highlights box
    for el in list(p5):
        if el.attrib.get(D('style-name')) == 'gr108' or el.attrib.get(D('name')) in ['Card Demo Right', 'PreviewBooking', 'CaptionBooking']:
            p5.remove(el)

    # Position: x=21.0cm, y=9.5cm, w=11.2cm, h=6.3cm
    card_booking_img = create_round_card('21.0cm', '9.4cm', '11.4cm', '6.5cm', 'Card Demo Right')
    p5.append(card_booking_img)
    frame_booking = create_image_frame('PreviewBooking', 'Pictures/preview_booking.png', '21.2cm', '9.55cm', '11.0cm', '6.2cm')
    p5.append(frame_booking)

    # Caption / highlights shape under/over the preview
    caption_shape = create_text_shape('gr72', 'P3', '21.0cm', '16.0cm', '11.4cm', '0.9cm', [
        ('P2', [('T19', 'HAPPY PATH: '), ('T16', 'Sơ đồ 164 ghế thực tế & Giữ chỗ 5 phút')]),
        ('P2', [('T15', '• '), ('T18', 'Demo thêm: Thẻ thành viên 3D · Admin soát vé QR (56/56 Tests PASS)')])
    ], 'CaptionBooking')
    p5.append(caption_shape)

    notes_p5 = None
    for el in list(p5):
        if el.tag.split('}')[-1] == 'notes':
            notes_p5 = el
            p5.remove(el)
            break
    if notes_p5 is not None:
        p5.append(notes_p5)

    # =========================================================================
    # SLIDE 6 — TEAM & GIT (Bớt chữ, súc tích)
    # =========================================================================
    p6 = pages[5]
    for el in p6:
        s = el.attrib.get(D('style-name'))
        name = el.attrib.get(D('name'), '')
        if s == 'gr116':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Nguyễn Văn Trọng — Leader & Architect: Kiến trúc 14 trang MPA, Router & REST API, Bun runtime, Vercel Serverless.'
        elif s == 'gr118':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Vũ Tiến Lập — Frontend & QA Lead: Module Checkout, bắp nước, Bảng giá vé, Tin tức, Cụm rạp, Bộ test 56/56.'
        elif s == 'gr120':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Phạm Anh Duy — Feature Lead & Integrator: Sơ đồ 164 ghế & đếm ngược 5p, Hệ thống Voucher, Thẻ thành viên 3D, Cổng Admin QR.'
        elif s == 'gr125' and name != 'Body Next Steps':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Khó khăn: Đồng bộ trạng thái giữ ghế thời gian thực giữa json-server, cache client và Vercel Serverless (read-only filesystem).'
        elif s == 'gr127':
            for p in el.findall('.//text:p', namespaces):
                for span in p.findall('.//text:span', namespaces):
                    span.text = 'Cách xử lý: Kiến trúc Hybrid Storage (api.js + storage.js) đa tầng kèm cơ chế sao chép database tạm vào /tmp trên Vercel.'
        elif name == 'Body Next Steps':
            el.clear()
            el.attrib.update({
                D('name'): 'Body Next Steps',
                D('style-name'): 'gr125',
                D('text-style-name'): 'P3',
                D('layer'): 'layout',
                S('x'): '18.263cm',
                S('y'): '13.25cm',
                S('width'): '13.309cm',
                S('height'): '2.5cm'
            })
            p1 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p1, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p1, T('span'), {T('style-name'): 'T16'}).text = 'Tích hợp cổng thanh toán trực tiếp qua Webhook VNPAY / MoMo thực tế.'
            p2 = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p2, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p2, T('span'), {T('style-name'): 'T16'}).text = 'Phát triển ứng dụng di động (PWA) và tự động gửi vé qua Zalo ZNS / SMS.'
            p3_sub = ET.SubElement(el, T('p'), {T('style-name'): 'P2'})
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T15'}).text = '• '
            ET.SubElement(p3_sub, T('span'), {T('style-name'): 'T16'}).text = 'Quản lý động sơ đồ phòng chiếu & chiến dịch ưu đãi giờ vàng trên Admin.'

    # Save content.xml and update zip
    new_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    all_files['content.xml'] = new_xml

    with zipfile.ZipFile(odp_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name, data in all_files.items():
            z.writestr(name, data)

    print("Beta-Cinemas-Presentation.odp refined with preview images and concise text successfully!")

if __name__ == '__main__':
    refine_presentation()
