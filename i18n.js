/**
 * i18n System — 5 languages
 * Order: English (default) → 한국어 → हिन्दी → 日本語 → 中文(简体)
 *
 * Resolution order:
 *   1. explicit user choice saved in localStorage
 *   2. browser preference (navigator.languages, then navigator.language)
 *   3. English
 */
const I18N = {
  // ----------------------------------------
  // Language metadata
  // ----------------------------------------
  langs: {
    en: { name: 'English', native: 'English', flag: '🇺🇸' },
    ko: { name: 'Korean', native: '한국어', flag: '🇰🇷' },
    hi: { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    ja: { name: 'Japanese', native: '日本語', flag: '🇯🇵' },
    'zh-CN': { name: 'Chinese (Simplified)', native: '中文(简体)', flag: '🇨🇳' }
  },

  // Selector display order
  order: ['en', 'ko', 'hi', 'ja', 'zh-CN'],

  defaultLang: 'en',
  currentLang: 'en',
  storageKey: 'md2pdf-lang',

  // Callbacks fired after a language change (used by app.js to re-translate
  // text that is not part of the static markup).
  listeners: [],

  // ----------------------------------------
  // Translations
  // ----------------------------------------
  t: {
    // ============ SEO ============
    seoTitle: {
      en: 'Md2Pdf — Free Markdown to PDF Converter (Math, Mermaid, Images)',
      ko: 'Md2Pdf — 무료 마크다운 PDF 변환기 (수식, 다이어그램, 이미지)',
      hi: 'Md2Pdf — मुफ़्त मार्कडाउन से PDF कन्वर्टर (गणित, डायग्राम, इमेज)',
      ja: 'Md2Pdf — 無料 Markdown→PDF 変換ツール（数式・図表・画像）',
      'zh-CN': 'Md2Pdf — 免费 Markdown 转 PDF 工具（公式、图表、图片）'
    },

    seoDescription: {
      en: 'Convert Markdown to PDF online for free. Supports LaTeX math via KaTeX, Mermaid diagrams, images and GFM tables. 100% client-side — your files never leave your browser. Works offline.',
      ko: '마크다운을 PDF로 변환하는 무료 도구입니다. KaTeX 수식, Mermaid 다이어그램, 이미지, GFM 테이블을 지원하며, 파일이 브라우저를 벗어나지 않는 완전 클라이언트 구조입니다.',
      hi: 'मार्कडाउन को मुफ़्त में PDF में बदलें। KaTeX गणित, Mermaid डायग्राम, इमेज और GFM टेबल समर्थित। पूरी तरह क्लाइंट-साइड — फ़ाइलें ब्राउज़र से बाहर नहीं जातीं।',
      ja: 'Markdown を無料で PDF に変換。KaTeX の数式、Mermaid の図表、画像、GFM テーブルに対応。完全クライアントサイドで、ファイルはブラウザーの外に出ません。',
      'zh-CN': '免费将 Markdown 转换为 PDF。支持 KaTeX 公式、Mermaid 图表、图片与 GFM 表格。纯客户端运行，文件不会离开你的浏览器。'
    },

    seoSectionTitle: {
      en: 'Convert Markdown to PDF — right in your browser',
      ko: '브라우저에서 바로, 마크다운을 PDF로',
      hi: 'अपने ब्राउज़र में ही मार्कडाउन को PDF में बदलें',
      ja: 'ブラウザー内で Markdown を PDF へ',
      'zh-CN': '直接在浏览器里把 Markdown 转成 PDF'
    },

    seoSectionIntro: {
      en: 'Md2Pdf is a free Markdown to PDF converter with live preview. It renders GitHub Flavored Markdown, LaTeX math through KaTeX, Mermaid diagrams and images, then exports a print-ready A4 document.',
      ko: 'Md2Pdf는 실시간 미리보기를 갖춘 무료 마크다운 PDF 변환기입니다. GitHub Flavored Markdown, KaTeX 수식, Mermaid 다이어그램, 이미지를 렌더링한 뒤 인쇄용 A4 문서로 저장합니다.',
      hi: 'Md2Pdf लाइव प्रीव्यू वाला मुफ़्त मार्कडाउन से PDF कन्वर्टर है। यह GitHub Flavored Markdown, KaTeX गणित, Mermaid डायग्राम और इमेज रेंडर करके प्रिंट-रेडी A4 दस्तावेज़ बनाता है।',
      ja: 'Md2Pdf はライブプレビュー付きの無料 Markdown→PDF 変換ツールです。GitHub Flavored Markdown、KaTeX の数式、Mermaid の図表、画像を描画し、印刷対応の A4 文書として書き出します。',
      'zh-CN': 'Md2Pdf 是带实时预览的免费 Markdown 转 PDF 工具。它会渲染 GitHub Flavored Markdown、KaTeX 公式、Mermaid 图表与图片，并导出可直接打印的 A4 文档。'
    },

    seoHeadingFeatures: {
      en: 'Everything you need for a polished PDF',
      ko: '완성도 높은 PDF를 위한 기능',
      hi: 'बेहतरीन PDF के लिए सब कुछ',
      ja: '洗練されたPDFに必要なすべて',
      'zh-CN': '生成精美 PDF 所需的一切'
    },

    seoHeadingUseCases: {
      en: 'What people use it for',
      ko: '이런 곳에 쓰입니다',
      hi: 'लोग इसका उपयोग कहाँ करते हैं',
      ja: '活用事例',
      'zh-CN': '常见使用场景'
    },

    seoFeature1Title: {
      en: 'LaTeX math that renders',
      ko: 'LaTeX 수식 렌더링',
      hi: 'प्रतिव्यापित LaTeX गणित',
      ja: 'LaTeX 数式の描画',
      'zh-CN': 'LaTeX 公式渲染'
    },
    seoFeature1Body: {
      en: 'Inline $E = mc^2$ and display blocks with KaTeX, ready for print.',
      ko: '인라인 $E = mc^2$와 디스플레이 수식을 KaTeX로 렌더링합니다.',
      hi: 'इनलाइन $E = mc^2$ और डिस्प्ले ब्लॉक KaTeX से तैयार।',
      ja: 'インライン $E = mc^2$ や表示数式を KaTeX で描画。',
      'zh-CN': '用 KaTeX 渲染行内 $E = mc^2$ 与块级公式。'
    },

    seoFeature2Title: {
      en: 'Mermaid diagrams as vectors',
      ko: '벡터 다이어그램',
      hi: 'वेक्टर डायग्राम',
      ja: 'ベクター図表',
      'zh-CN': '矢量图表'
    },
    seoFeature2Body: {
      en: 'Flowcharts, sequence and class diagrams convert to crisp, printable graphics.',
      ko: '플로우차트, 시퀀스, 클래스 다이어그램을 선명한 이미지로 변환합니다.',
      hi: 'फ्लोचार्ट, सीक्वेंस और क्लास डायग्राम साफ़ प्रिंट ग्राफ़िक में बदलते हैं।',
      ja: 'フローチャート・シーケンス・クラス図を鮮明な画像に変換。',
      'zh-CN': '流程图、时序图、类图转成清晰的矢量图形。'
    },

    seoFeature3Title: {
      en: 'Private by design',
      ko: '프라이버시 우선',
      hi: 'गोपनीयता-प्रथम',
      ja: 'プライバシー重視',
      'zh-CN': '隐私优先'
    },
    seoFeature3Body: {
      en: 'Parsing and PDF generation happen locally. No server, no upload, no tracking.',
      ko: '파싱과 PDF 생성이 모두 로컬에서 이뤄집니다. 서버·업로드·추적 없음.',
      hi: 'पार्सिंग और PDF जनरेशन लोकल रूप से होता है। कोई सर्वर या अपलोड नहीं।',
      ja: '解析もPDF生成もすべてローカル。サーバーもアップロードもなし。',
      'zh-CN': '解析与 PDF 生成全在本地完成，无服务器、无上传、无追踪。'
    },

    seoFeature4Title: {
      en: 'Live split preview',
      ko: '실시간 분할 미리보기',
      hi: 'लाइव विभाजित प्रीव्यू',
      ja: 'ライブ分割プレビュー',
      'zh-CN': '实时分栏预览'
    },
    seoFeature4Body: {
      en: 'Edit Markdown on the left, watch the A4 page update on the right.',
      ko: '왼쪽에서 마크다운을 편집하면 오른쪽 미리보기가 즉시 갱신됩니다.',
      hi: 'बाईं ओर मार्कडाउन संपादित करें, दाईं ओर अपडेट देखें।',
      ja: '左で編集、右でリアルタイムにプレビュー。',
      'zh-CN': '左侧编辑 Markdown，右侧实时查看成品。'
    },

    seoFeature5Title: {
      en: 'Smart page breaks',
      ko: '자동 페이지 나누기',
      hi: 'स्मार्ट पेज ब्रेक',
      ja: '自動改ページ',
      'zh-CN': '智能分页'
    },
    seoFeature5Body: {
      en: 'Tables, code blocks, quotes and diagrams never split across pages.',
      ko: '표, 코드 블록, 인용문, 다이어그램이 페이지 중간에 잘리지 않습니다.',
      hi: 'टेबल, कोड ब्लॉक, उद्धरण और डायग्राम कभी बीच में नहीं टूटते।',
      ja: '表・コード・引用・図表がページを跨ぎません。',
      'zh-CN': '表格、代码块、引用与图表不会跨页断裂。'
    },

    seoFeature6Title: {
      en: 'Works offline',
      ko: '오프라인 동작',
      hi: 'ऑफ़लाइन उपयोग',
      ja: 'オフライン対応',
      'zh-CN': '离线可用'
    },
    seoFeature6Body: {
      en: 'Load once, then convert documents with no connection at all.',
      ko: '한 번 로드하면 연결 없이도 문서를 변환할 수 있습니다.',
      hi: 'एक बार लोड करें, फिर बिना इंटरनेट काम करें।',
      ja: '一度読み込めばオフラインでも変換できます。',
      'zh-CN': '加载一次后，断网也能继续转换文档。'
    },

    seoHeadingFaq: {
      en: 'Frequently asked questions',
      ko: '자주 묻는 질문',
      hi: 'अक्सर पूछे जाने वाले प्रश्न',
      ja: 'よくある質問',
      'zh-CN': '常见问题'
    },

    seoFaq1Q: {
      en: 'Is Md2Pdf really free?',
      ko: 'Md2Pdf는 정말 무료인가요?',
      hi: 'क्या Md2Pdf सचमुच मुफ़्त है?',
      ja: 'Md2Pdf は本当に無料ですか？',
      'zh-CN': 'Md2Pdf 真的免费吗？'
    },
    seoFaq1A: {
      en: 'Yes — there is no account, no watermark and no usage limit. The converter runs entirely in your browser.',
      ko: '네. 계정, 워터마크, 사용 제한이 없습니다. 변환기는 전부 브라우저에서 동작합니다.',
      hi: 'हाँ — कोई खाता, वॉटरमार्क या सीमा नहीं। पूरी प्रक्रिया ब्राउज़र में चलती है।',
      ja: 'はい。アカウントもウォーターマークも利用制限もありません。すべてブラウザ内で動作します。',
      'zh-CN': '是的。无需账号、没有水印、没有次数限制，转换全部在浏览器内完成。'
    },

    seoFaq2Q: {
      en: 'Are my Markdown files uploaded anywhere?',
      ko: '제 마크다운 파일이 서버로 올라가나요?',
      hi: 'क्या मेरी फ़ाइलें कहीं अपलोड होती हैं?',
      ja: 'Markdownファイルはアップロードされますか？',
      'zh-CN': '我的 Markdown 文件会被上传吗？'
    },
    seoFaq2A: {
      en: 'No. Parsing, rendering and PDF creation all run locally in your tab. Your document never touches a server.',
      ko: '아니요. 파싱, 렌더링, PDF 생성이 모두 탭 안에서 실행되므로 문서가 서버에 닿지 않습니다.',
      hi: 'नहीं। पार्सिंग, रेंडरिंग और PDF निर्माण सब आपके टैब में होते हैं।',
      ja: 'いいえ。解析・描画・PDF生成すべてタブ内で実行され、サーバーに送信されません。',
      'zh-CN': '不会。解析、渲染与 PDF 生成全在标签页内完成，文档不会发送到任何服务器。'
    },

    seoFaq3Q: {
      en: 'Which Markdown syntax is supported?',
      ko: '어떤 마크다운 문법을 지원하나요?',
      hi: 'कौन-सी मार्कडाउन सिंटैक्स समर्थित है?',
      ja: 'どの Markdown 構文に対応していますか？',
      'zh-CN': '支持哪些 Markdown 语法？'
    },
    seoFaq3A: {
      en: 'GFM tables, task lists, strikethrough, footnotes, fenced code blocks with highlighting, LaTeX math and Mermaid diagrams.',
      ko: 'GFM 테이블, 작업 목록, 취소선, 각주, 문법 강조 코드 블록, LaTeX 수식, Mermaid 다이어그램을 지원합니다.',
      hi: 'GFM टेबल, टास्क सूची, स्ट्राइकथ्रू, फुटनोट, सिंटैक्स हाइलाइट वाले कोड ब्लॉक, LaTeX गणित और Mermaid डायग्राम।',
      ja: 'GFM表・タスクリスト・取り消し線・脚注・シンタックスハイライト付きコードブロック・LaTeX数式・Mermaid図に対応。',
      'zh-CN': 'GFM 表格、任务列表、删除线、脚注、带语法高亮的代码块、LaTeX 公式与 Mermaid 图表。'
    },

    seoFaq4Q: {
      en: 'Which languages does the interface support?',
      ko: '인터페이스는 어떤 언어를 지원하나요?',
      hi: 'इंटरफ़ेस कौन-सी भाषाएँ समर्थित करता है?',
      ja: 'インターフェースはどの言語に対応していますか？',
      'zh-CN': '界面支持哪些语言？'
    },
    seoFaq4A: {
      en: 'English, Korean, Hindi, Japanese and Simplified Chinese — selected automatically from your browser setting.',
      ko: '영어, 한국어, 힌디어, 일본어, 중국어(간체)를 지원하며 브라우저 설정에 맞춰 자동 선택됩니다.',
      hi: 'अंग्रेज़ी, कोरियाई, हिन्दी, जापानी और सरलीकृत चीनी — आपके ब्राउज़र सेटिंग से अपने आप चुनी जाती है।',
      ja: '英語・韓国語・ヒンディー語・日本語・簡体字中国語に対応し、ブラウザの設定から自動選択されます。',
      'zh-CN': '英语、韩语、印地语、日语与简体中文，会根据浏览器设置自动选择。'
    },

    seoUseCase1: {
      en: 'Technical documentation and API references that contain LaTeX formulas.',
      ko: 'LaTeX 수식이 포함된 기술 문서와 API 레퍼런스.',
      hi: 'LaTeX सूत्रों वाले तकनीकी दस्तावेज़ और API संदर्भ।',
      ja: 'LaTeX 数式を含む技術ドキュメントや API リファレンス。',
      'zh-CN': '包含 LaTeX 公式的技术文档与 API 参考手册。'
    },

    seoUseCase2: {
      en: 'Architecture, sequence and flow diagrams authored in Mermaid.',
      ko: 'Mermaid로 작성한 아키텍처·시퀀스·플로우 다이어그램.',
      hi: 'Mermaid में लिखी आर्किटेक्चर, सीक्वेंस और फ्लो डायग्राम।',
      ja: 'Mermaid で書いたアーキテクチャ図・シーケンス図・フロー図。',
      'zh-CN': '用 Mermaid 编写的架构图、时序图与流程图。'
    },

    seoUseCase3: {
      en: 'Research notes, reports and READMEs that need a printable A4 version.',
      ko: '인쇄용 A4 버전이 필요한 연구 노트, 보고서, README.',
      hi: 'उन शोध नोट्स, रिपोर्ट और README जिन्हें प्रिंट करने योग्य A4 चाहिए।',
      ja: '印刷用 A4 が欲しい調査ノート、レポート、README。',
      'zh-CN': '需要 A4 可打印版本的研究笔记、报告与 README。'
    },

    // ============ LANDING ============
    brand: {
      en: 'Md2Pdf',
      ko: 'Md2Pdf',
      hi: 'Md2Pdf',
      ja: 'Md2Pdf',
      'zh-CN': 'Md2Pdf'
    },

    docTitleSeparator: {
      en: ' — ',
      ko: ' — ',
      hi: ' — ',
      ja: ' — ',
      'zh-CN': ' — '
    },

    landingTitle: {
      en: 'Markdown to',
      ko: '마크다운을',
      hi: 'मार्कडाउन को',
      ja: 'Markdownを',
      'zh-CN': '将 Markdown 转为'
    },

    landingTitleHighlight: {
      en: 'Beautiful PDF',
      ko: '아름다운 PDF로',
      hi: 'सुंदर PDF में',
      ja: '美しいPDFに',
      'zh-CN': '精美 PDF'
    },

    landingSubtitle: {
      en: 'Convert with math, diagrams & images. Fully client-side, privacy-first.',
      ko: '수식·다이어그램·이미지까지 완벽 변환. 서버 없이 브라우저에서만 동작하는 프라이빗 도구.',
      hi: 'गणित, डायग्राम और इमेज के साथ बदलें। पूरी तरह क्लाइंट-साइड, गोपनीयता-प्रथम।',
      ja: '数式・図表・画像に完全対応。サーバー不要、ブラウザのみで動作するプライベートツール。',
      'zh-CN': '完美支持公式、图表和图片。纯客户端运行，隐私优先。'
    },

    dropMain: {
      en: 'Drag & drop your <strong>Markdown file</strong> here',
      ko: '마크다운 파일을 <strong>드래그 앤 드롭</strong>하세요',
      hi: 'अपनी <strong>मार्कडाउन फ़ाइल</strong> को यहाँ खींचें',
      ja: '<strong>Markdownファイル</strong>をドラッグ&ドロップ',
      'zh-CN': '将 <strong>Markdown 文件</strong> 拖放至此'
    },

    dropHint: {
      en: 'or <button id="browseBtn" class="btn-ghost">browse files</button>',
      ko: '또는 <button id="browseBtn" class="btn-ghost">파일 선택</button>',
      hi: 'या <button id="browseBtn" class="btn-ghost">फ़ाइल चुनें</button>',
      ja: 'または <button id="browseBtn" class="btn-ghost">ファイル選択</button>',
      'zh-CN': '或 <button id="browseBtn" class="btn-ghost">选择文件</button>'
    },

    dropFormats: {
      en: 'Supports: <code>.md</code> · <code>.markdown</code> · <code>.txt</code>',
      ko: '지원: <code>.md</code> · <code>.markdown</code> · <code>.txt</code>',
      hi: 'समर्थित: <code>.md</code> · <code>.markdown</code> · <code>.txt</code>',
      ja: '対応: <code>.md</code> · <code>.markdown</code> · <code>.txt</code>',
      'zh-CN': '支持: <code>.md</code> · <code>.markdown</code> · <code>.txt</code>'
    },

    dragOverlay: {
      en: 'Drop here',
      ko: '여기에 놓으세요',
      hi: 'यहाँ छोड़ें',
      ja: 'ここにドロップ',
      'zh-CN': '释放至此'
    },

    // Feature pills
    pillGfm: { en: 'GFM', ko: 'GFM', hi: 'GFM', ja: 'GFM', 'zh-CN': 'GFM' },
    pillKatex: { en: 'KaTeX', ko: 'KaTeX', hi: 'KaTeX', ja: 'KaTeX', 'zh-CN': 'KaTeX' },
    pillMermaid: { en: 'Mermaid', ko: 'Mermaid', hi: 'Mermaid', ja: 'Mermaid', 'zh-CN': 'Mermaid' },
    pillImages: {
      en: 'Images',
      ko: '이미지',
      hi: 'इमेज',
      ja: '画像',
      'zh-CN': '图片'
    },
    pillPrivate: {
      en: 'Private',
      ko: '비공개',
      hi: 'निजी',
      ja: 'プライベート',
      'zh-CN': '私密'
    },

    // Trust bar
    trustNoUpload: {
      en: 'No data upload',
      ko: '데이터 업로드 없음',
      hi: 'कोई डेटा अपलोड नहीं',
      ja: 'データアップロードなし',
      'zh-CN': '无数据上传'
    },

    trustOffline: {
      en: 'Works offline',
      ko: '오프라인 동작',
      hi: 'ऑफ़लाइन काम करता है',
      ja: 'オフライン動作',
      'zh-CN': '离线可用'
    },

    trustInstant: {
      en: 'Instant conversion',
      ko: '즉시 변환',
      hi: 'त्वरित रूपांतरण',
      ja: '即座に変換',
      'zh-CN': '即时转换'
    },

    // ============ EDITOR ============
    btnHome: {
      en: 'Home',
      ko: '홈',
      hi: 'होम',
      ja: 'ホーム',
      'zh-CN': '首页'
    },

    docTitleDefault: {
      en: 'Untitled Document',
      ko: '제목 없는 문서',
      hi: 'बिना शीर्षक का दस्तावेज़',
      ja: '無題のドキュメント',
      'zh-CN': '无标题文档'
    },

    fileBadge: {
      en: 'Markdown',
      ko: '마크다운',
      hi: 'मार्कडाउन',
      ja: 'Markdown',
      'zh-CN': 'Markdown'
    },

    paneEditor: {
      en: 'Editor',
      ko: '편집기',
      hi: 'संपादक',
      ja: 'エディタ',
      'zh-CN': '编辑器'
    },

    panePreview: {
      en: 'Preview',
      ko: '미리보기',
      hi: 'पूर्वावलोकन',
      ja: 'プレビュー',
      'zh-CN': '预览'
    },

    editorPlaceholder: {
      en: 'Write Markdown here…\n\n# Heading\n\n**Bold** *Italic*\n\n$E = mc^2$\n\n```mermaid\nflowchart TD\n  A --> B\n```',
      ko: '마크다운을 입력하세요…\n\n# 제목\n\n**굵게** *기울임*\n\n$E = mc^2$\n\n```mermaid\nflowchart TD\n  A --> B\n```',
      hi: 'यहाँ मार्कडाउन लिखें…\n\n# शीर्षक\n\n**बोल्ड** *इटैलिक*\n\n$E = mc^2$\n\n```mermaid\nflowchart TD\n  A --> B\n```',
      ja: 'ここにMarkdownを入力…\n\n# 見出し\n\n**太字** *斜体*\n\n$E = mc^2$\n\n```mermaid\nflowchart TD\n  A --> B\n```',
      'zh-CN': '在此编写 Markdown…\n\n# 标题\n\n**粗体** *斜体*\n\n$E = mc^2$\n\n```mermaid\nflowchart TD\n  A --> B\n```'
    },

    showRaw: {
      en: 'Show source',
      ko: '원본 보기',
      hi: 'स्रोत दिखाएँ',
      ja: 'ソース表示',
      'zh-CN': '显示源码'
    },

    statsChars: {
      en: 'chars',
      ko: '문자',
      hi: 'अक्षर',
      ja: '文字',
      'zh-CN': '字符'
    },
    statsLines: { en: 'lines', ko: '줄', hi: 'पंक्तियाँ', ja: '行', 'zh-CN': '行' },
    statsWords: {
      en: 'words',
      ko: '단어',
      hi: 'शब्द',
      ja: '単語',
      'zh-CN': '单词'
    },

    previewPlaceholder: {
      en: 'Live preview appears here',
      ko: '좌측에서 마크다운을 편집하세요',
      hi: 'बाईं ओर मार्कडाउन संपादित करें',
      ja: '左側でMarkdownを編集',
      'zh-CN': '左侧编辑 Markdown'
    },

    previewHint: {
      en: 'Real-time rendering',
      ko: '실시간으로 렌더링됩니다',
      hi: 'रियल-टाइम रेंडरिंग',
      ja: 'リアルタイムレンダリング',
      'zh-CN': '实时渲染'
    },

    // ============ ACTIONS ============
    btnDownload: {
      en: 'Download PDF',
      ko: 'PDF 다운로드',
      hi: 'PDF डाउनलोड',
      ja: 'PDFダウンロード',
      'zh-CN': '下载 PDF'
    },

    btnDownloading: {
      en: 'Generating…',
      ko: '생성 중…',
      hi: 'जनरेट हो रहा…',
      ja: '生成中…',
      'zh-CN': '生成中…'
    },

    // ============ LOADING ============
    loadingText: {
      en: 'Generating PDF…',
      ko: 'PDF 생성 중…',
      hi: 'PDF जनरेट हो रहा…',
      ja: 'PDFを生成中…',
      'zh-CN': '正在生成 PDF…'
    },

    // ============ TOASTS ============
    toastSuccess: {
      en: 'PDF downloaded!',
      ko: 'PDF 다운로드 완료!',
      hi: 'PDF डाउनलोड हो गया!',
      ja: 'PDFをダウンロードしました！',
      'zh-CN': 'PDF 下载完成！'
    },

    toastError: {
      en: 'Failed to generate PDF',
      ko: 'PDF 생성에 실패했습니다',
      hi: 'PDF जनरेट करने में विफल',
      ja: 'PDFの生成に失敗しました',
      'zh-CN': 'PDF 生成失败'
    },

    toastErrorFile: {
      en: 'Unsupported file type. Use .md, .markdown, or .txt',
      ko: '지원하지 않는 파일 형식입니다. .md, .markdown, .txt 파일을 업로드하세요.',
      hi: 'असमर्थित फ़ाइल प्रकार। .md, .markdown, या .txt का उपयोग करें',
      ja: 'サポートされていないファイル形式です。.md、.markdown、.txt を使用してください',
      'zh-CN': '不支持的文件类型。请使用 .md、.markdown 或 .txt'
    },

    toastErrorRead: {
      en: 'Could not read the file',
      ko: '파일을 읽을 수 없습니다',
      hi: 'फ़ाइल पढ़ी नहीं जा सकी',
      ja: 'ファイルを読み込めませんでした',
      'zh-CN': '无法读取文件'
    },

    toastErrorGeneric: {
      en: 'Error: ',
      ko: '오류: ',
      hi: 'त्रुटि: ',
      ja: 'エラー: ',
      'zh-CN': '错误: '
    },

    // ============ ARIA / ATTRIBUTES ============
    ariaDropZone: {
      en: 'Upload Markdown file',
      ko: '마크다운 파일 업로드',
      hi: 'मार्कडाउन फ़ाइल अपलोड करें',
      ja: 'Markdownファイルをアップロード',
      'zh-CN': '上传 Markdown 文件'
    },

    ariaEditor: {
      en: 'Markdown editor',
      ko: '마크다운 편집기',
      hi: 'मार्कडाउन संपादक',
      ja: 'Markdownエディタ',
      'zh-CN': 'Markdown 编辑器'
    },

    ariaResizer: {
      en: 'Resize panels',
      ko: '패널 크기 조절',
      hi: 'पैनल आकार बदलें',
      ja: 'パネルサイズ調整',
      'zh-CN': '调整面板大小'
    },

    ariaLayoutToggle: {
      en: 'Toggle layout',
      ko: '레이아웃 전환',
      hi: 'लेआउट टॉगल',
      ja: 'レイアウト切替',
      'zh-CN': '切换布局'
    },

    ariaHome: {
      en: 'Go home',
      ko: '홈으로 돌아가기',
      hi: 'होम पर जाएँ',
      ja: 'ホームに戻る',
      'zh-CN': '返回首页'
    },

    ariaDownload: {
      en: 'Download PDF',
      ko: 'PDF 다운로드',
      hi: 'PDF डाउनलोड',
      ja: 'PDFをダウンロード',
      'zh-CN': '下载 PDF'
    },

    ariaLangSelector: {
      en: 'Select language',
      ko: '언어 선택',
      hi: 'भाषा चुनें',
      ja: '言語を選択',
      'zh-CN': '选择语言'
    },

    // ============ LANGUAGE SELECTOR ============
    langSelf: {
      en: { en: 'English', ko: '영어', hi: 'अंग्रेज़ी', ja: '英語', 'zh-CN': '英语' },
      ko: { en: 'Korean', ko: '한국어', hi: 'कोरियाई', ja: '韓国語', 'zh-CN': '韩语' },
      hi: { en: 'Hindi', ko: '힌디어', hi: 'हिन्दी', ja: 'ヒンディー語', 'zh-CN': '印地语' },
      ja: { en: 'Japanese', ko: '일본어', hi: 'जापानी', ja: '日本語', 'zh-CN': '日语' },
      'zh-CN': {
        en: 'Chinese (Simplified)',
        ko: '중국어(간체)',
        hi: 'सरलीकृत चीनी',
        ja: '簡体字中国語',
        'zh-CN': '中文(简体)'
      }
    },

    langLabel: {
      en: 'Language',
      ko: '언어',
      hi: 'भाषा',
      ja: '言語',
      'zh-CN': '语言'
    }
  },

  // ----------------------------------------
  // Translation lookup
  // ----------------------------------------
  get(key) {
    if (!key) return '';

    const path = key.split('.');
    let node = this.t;
    for (const part of path) {
      if (!node || typeof node !== 'object' || !(part in node)) return key;
      node = node[part];
    }

    if (typeof node !== 'object' || node === null) return node;
    return node[this.currentLang] || node[this.defaultLang] || key;
  },

  // Translation with {placeholder} interpolation
  getFormatted(key, vars = {}) {
    let str = this.get(key);
    for (const [name, value] of Object.entries(vars)) {
      str = String(str).replace(new RegExp(`\\{${name}\\}`, 'g'), value);
    }
    return str;
  },

  // ----------------------------------------
  // Detection
  // ----------------------------------------
  detectLanguage() {
    const candidates = [];

    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
    if (navigator.language) candidates.push(navigator.language);
    if (navigator.userLanguage) candidates.push(navigator.userLanguage);

    for (const raw of candidates) {
      if (!raw) continue;
      const tag = String(raw).toLowerCase();
      const base = tag.split('-')[0];

      // All Chinese variants map to Simplified Chinese
      if (base === 'zh') return 'zh-CN';
      if (Object.prototype.hasOwnProperty.call(this.langs, base)) return base;
      if (Object.prototype.hasOwnProperty.call(this.langs, tag)) return tag;
    }

    return this.defaultLang;
  },

  readStoredLang() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved && Object.prototype.hasOwnProperty.call(this.langs, saved) ? saved : null;
    } catch (err) {
      console.warn('i18n: localStorage unavailable, using browser language', err);
      return null;
    }
  },

  // ?lang=xx is the entry point for hreflang / localized links
  readQueryLang() {
    try {
      const param = new URLSearchParams(window.location.search).get('lang');
      if (!param) return null;

      const tag = param.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(this.langs, tag)) return tag;

      const base = tag.split('-')[0];
      if (base === 'zh') return 'zh-CN';
      if (Object.prototype.hasOwnProperty.call(this.langs, base)) return base;
    } catch (err) {
      console.warn('i18n: could not read ?lang from the URL', err);
    }
    return null;
  },

  storeLang(lang) {
    try {
      localStorage.setItem(this.storageKey, lang);
    } catch (err) {
      console.warn('i18n: could not persist language choice', err);
    }
  },

  // ----------------------------------------
  // Lifecycle
  // ----------------------------------------
  init() {
    this.currentLang =
      this.readQueryLang() || this.readStoredLang() || this.detectLanguage();
    this.applyDocumentAttrs();
    return this.currentLang;
  },

  applyDocumentAttrs() {
    document.documentElement.lang = this.currentLang;
    document.documentElement.dir = 'ltr';
  },

  set(lang) {
    if (!Object.prototype.hasOwnProperty.call(this.langs, lang)) return false;

    this.currentLang = lang;
    this.storeLang(lang);
    this.applyDocumentAttrs();
    this.syncUrl();
    this.apply();
    this.emit();
    return true;
  },

  // Keep ?lang= in step with the choice so reloads and shared links agree
  syncUrl() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('lang') === this.currentLang) return;

      if (this.readQueryLang() === this.currentLang) {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', this.currentLang);
      }
      window.history.replaceState({}, '', url);
    } catch (err) {
      console.warn('i18n: could not sync the URL', err);
    }
  },

  onChange(fn) {
    if (typeof fn === 'function') this.listeners.push(fn);
  },

  emit() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.currentLang);
      } catch (err) {
        console.error('i18n: language-change listener failed', err);
      }
    });
  },

  /**
   * Paint every translated string into the DOM.
   * Safe to call repeatedly (language switch re-runs it).
   */
  apply() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = this.get(key);
      if (typeof value !== 'string' || value === key) return;

      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = value;
      } else if (el.tagName === 'TEXTAREA') {
        el.placeholder = value;
      } else if (
        el.tagName === 'INPUT' &&
        ['text', 'search', 'email', 'url', 'tel'].includes(el.type)
      ) {
        el.placeholder = value;
      } else if (el.tagName === 'META') {
        el.setAttribute('content', value);
      } else if (el.children.length === 0) {
        el.textContent = value;
      }
      // Never touch textContent when the element has element children: those
      // carry data-i18n purely so data-i18n-attr can set aria-label/title, and
      // writing text would delete their icons and body markup.
    });

    // data-i18n-attr="aria-label" / "title" / ...
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = this.get(key);
      if (typeof value !== 'string' || value === key) return;
      el.setAttribute(el.getAttribute('data-i18n-attr'), value);
    });

    document.title = this.get('seoTitle');
    this.updateLanguageSelector();
  },

  // ----------------------------------------
  // Language selector UI
  // ----------------------------------------
  updateLanguageSelector() {
    const selector = document.getElementById('langSelector');
    if (!selector) return;

    const current = this.langs[this.currentLang] || this.langs[this.defaultLang];

    const trigger = selector.querySelector('.lang-trigger');
    if (trigger) {
      // Update only the text nodes — never innerHTML, or the chevron SVG dies.
      const flag = trigger.querySelector('.lang-flag');
      const name = trigger.querySelector('.lang-name');
      if (flag) flag.textContent = current.flag;
      if (name) name.textContent = current.native;
      trigger.setAttribute('aria-label', this.get('ariaLangSelector'));
    }

    selector.querySelectorAll('.lang-option').forEach((option) => {
      const code = option.dataset.lang;
      const isActive = code === this.currentLang;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-selected', String(isActive));
      option.setAttribute('lang', code);
      if (!option.hasAttribute('tabindex')) option.setAttribute('tabindex', '-1');

      const label = option.querySelector('.lang-name');
      const localized = this.get(`langSelf.${code}`);
      if (label && localized !== `langSelf.${code}`) label.textContent = localized;
    });
  },

  isSelectorOpen() {
    const selector = document.getElementById('langSelector');
    return Boolean(selector && selector.classList.contains('open'));
  },

  closeSelector() {
    const selector = document.getElementById('langSelector');
    if (!selector) return;
    selector.classList.remove('open');
    selector.setAttribute('aria-expanded', 'false');
  },

  openSelector(focusOption = false) {
    const selector = document.getElementById('langSelector');
    if (!selector) return;
    selector.classList.add('open');
    selector.setAttribute('aria-expanded', 'true');
    if (focusOption) {
      const active = selector.querySelector('.lang-option.active') ||
        selector.querySelector('.lang-option');
      active?.focus();
    }
  },

  setupSelector() {
    const selector = document.getElementById('langSelector');
    if (!selector || selector.dataset.i18nReady === 'true') return;

    const trigger = selector.querySelector('.lang-trigger');
    const options = Array.from(selector.querySelectorAll('.lang-option'));

    selector.dataset.i18nReady = 'true';
    selector.setAttribute('aria-expanded', 'false');

    const focusOptionAt = (index) => {
      if (!options.length) return;
      const wrapped = (index + options.length) % options.length;
      options.forEach((opt) => opt.setAttribute('tabindex', '-1'));
      options[wrapped].setAttribute('tabindex', '0');
      options[wrapped].focus();
    };

    const focusedIndex = () => {
      const index = options.findIndex((opt) => opt === document.activeElement);
      return index === -1 ? options.findIndex((opt) => opt.classList.contains('active')) : index;
    };

    trigger?.addEventListener('click', () => {
      if (selector.classList.contains('open')) {
        this.closeSelector();
      } else {
        this.openSelector();
      }
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        this.set(option.dataset.lang);
        this.closeSelector();
        trigger?.focus();
      });

      option.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          option.click();
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          focusOptionAt(focusedIndex() + 1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          focusOptionAt(focusedIndex() - 1);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          this.closeSelector();
          trigger?.focus();
        } else if (event.key === 'Tab') {
          this.closeSelector();
        }
      });
    });

    trigger?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.openSelector(true);
      }
    });

    // Outside click closes
    document.addEventListener('click', (event) => {
      if (!selector.contains(event.target)) this.closeSelector();
    });

    // Escape closes (highest priority, so app.js must not steal it)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && selector.classList.contains('open')) {
        event.stopPropagation();
        this.closeSelector();
        trigger?.focus();
      }
    });
  },

  // Boot as soon as the DOM exists
  ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }
};

I18N.init();
window.I18N = I18N;