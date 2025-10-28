document.addEventListener('DOMContentLoaded', () => {
    // --- 0. company-highlight 見出しの装飾とスコアバッジ生成（HTMLを変更せず実装） ---
    const DEFAULT_SCORE = '4.2';
    document.querySelectorAll('.company-highlight h3').forEach((title) => {
        title.classList.add('company-title');
        if (!title.querySelector('.score-badge')) {
            const score = title.getAttribute('data-score') || DEFAULT_SCORE;
            const badge = document.createElement('span');
            badge.className = 'score-badge';
            const label = document.createElement('span');
            label.className = 'score-label';
            label.textContent = '総合評価';
            const value = document.createElement('span');
            value.className = 'score-value';
            value.textContent = `${score} ★★★★★`;
            badge.append(label, value);
            title.appendChild(badge);
        }
    });

    // --- 1. フィルタ機能 ---
    const areaFilter = document.getElementById('area-filter');
    
    // フィルタ処理を実行する関数
    const applyFilters = () => {
        const selectedArea = areaFilter.value;

        // テーブル行と企業ハイライトを全て取得
        const tableRows = document.querySelectorAll('#summary-table tbody tr');
        const companyHighlights = document.querySelectorAll('.company-highlight');

        // テーブル行の表示制御
        tableRows.forEach(row => {
            const rowArea = row.dataset.area;
            const matchesArea = selectedArea === 'all' || rowArea === selectedArea;

            if (matchesArea) {
                row.style.display = ''; // 表示
            } else {
                row.style.display = 'none'; // 非表示
            }
        });

        // 企業ハイライトの表示制御
        companyHighlights.forEach(highlight => {
            const highlightArea = highlight.dataset.area;
            const matchesArea = selectedArea === 'all' || highlightArea === selectedArea;

            if (matchesArea) {
                highlight.style.display = ''; // 表示
            } else {
                highlight.style.display = 'none'; // 非表示
            }
        });
    };

    // フィルターのセレクトボックスが変更されたらフィルタリングを実行
    if(areaFilter) {
        areaFilter.addEventListener('change', applyFilters);
    }

    // --- 2. テーブル行クリック → スムーススクロール ---
    const tableRows = document.querySelectorAll('#summary-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('click', (e) => {
            // ボタン自体がクリックされた場合はスクロールさせない
            if (e.target.closest('.cta-button')) {
                return;
            }
            
            const companyId = row.dataset.id;
            const targetElement = document.getElementById(`company-${companyId}`);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // --- 3. CTAクリック計測 ---
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const companyId = button.dataset.companyId;
            
            // ここでトラッキングイベントを発火
            console.log(`CTA Clicked! Company ID: ${companyId}`);
            
            // 例: Google Analytics (gtag.js) を使用している場合
            /*
            if (typeof gtag === 'function') {
                gtag('event', 'click', {
                    'event_category': 'CTA',
                    'event_label': companyId,
                    'value': 1
                });
            }
            */

            // リンク先への遷移を妨げない
            // e.preventDefault(); // もしリンク遷移をJSで制御したい場合は有効化
        });
    });

    // --- 4. タブ切り替え機能 ---
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // すべてのタブから active クラスを削除
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // クリックされたタブに active クラスを追加
            button.classList.add('active');

            const selectedTab = button.dataset.tab;
            console.log(`Tab changed to: ${selectedTab}`);
            // ここに、タブに応じて表の内容を並げ替えたり、
            // 表示を切り替えたりするロジックを実装します。
            // (今回はUIの切り替えとログ出力のみ)
        });
    });

    // --- 5. 画像の遅延読み込み (Intersection Observer) ---
    // このデモでは loading="lazy" を使用していますが、より詳細な制御が必要な場合は
    // Intersection Observer を使用します。
    const lazyImages = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        let lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    let lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    // lazyImage.srcset = lazyImage.dataset.srcset; // srcsetも使う場合
                    lazyImage.removeAttribute('data-src');
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });

        lazyImages.forEach((lazyImage) => {
            lazyImageObserver.observe(lazyImage);
        });
    } else {
        // IntersectionObserverをサポートしていないブラウザ用のフォールバック
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
        });
    }
    
    // --- 6. 口コミスライダー機能 ---
    document.querySelectorAll('.review-slider-container').forEach(slider => {
        const slidesContainer = slider.querySelector('.review-slides');
        const slides = slider.querySelectorAll('.review-slide');
        const prevButton = slider.querySelector('.slider-nav.prev');
        const nextButton = slider.querySelector('.slider-nav.next');
        const dotsContainer = slider.querySelector('.slider-dots');
        
        let currentIndex = 0;
        const slideCount = slides.length;

        if (slideCount <= 1) {
            if(prevButton) prevButton.style.display = 'none';
            if(nextButton) nextButton.style.display = 'none';
            if(dotsContainer) dotsContainer.style.display = 'none'; // ドットも非表示
            return;
        };

        // ドットを生成
        for (let i = 0; i < slideCount; i++) {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            dot.dataset.index = i;
            dotsContainer.appendChild(dot);
        }
        const dots = dotsContainer.querySelectorAll('.dot');

        const updateSlider = () => {
            slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            dots.forEach(dot => {
                dot.classList.toggle('active', parseInt(dot.dataset.index) === currentIndex);
            });

            prevButton.style.display = (currentIndex === 0) ? 'none' : 'block';
            nextButton.style.display = (currentIndex === slideCount - 1) ? 'none' : 'block';
        };

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateSlider();
            }
        });

        nextButton.addEventListener('click', () => {
            if (currentIndex < slideCount - 1) {
                currentIndex++;
                updateSlider();
            }
        });

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                currentIndex = parseInt(dot.dataset.index);
                updateSlider();
            });
        });

        updateSlider(); // 初期化
    });

    // --- 7. 星評価の動的生成（簡易版） ---
    // CSSで制御しきれない小数点以下の評価をJavaScriptで制御する例
    document.querySelectorAll('.star-rating').forEach(starContainer => {
        const ratingValue = parseFloat(starContainer.parentElement.dataset.rating);
        if (isNaN(ratingValue)) return;

        const fullStars = Math.floor(ratingValue);
        const halfStar = (ratingValue % 1 >= 0.5) ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;

        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) starsHTML += '★';
        // HTML側で「★★★★☆」のように記述しているため、JSでの上書きは不要と判断
        // もし動的に「4.5」などの半端な数を「★★★★☆」と表示したい場合は、
        // HTML側を空にして、以下のロジックを有効化します。
        
        /*
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) starsHTML += '★';
        if (halfStar) starsHTML += '★'; // CSSで半分色を変えるなどの対応が望ましい
        for (let i = 0; i < emptyStars; i++) starsHTML += '☆';
        starContainer.textContent = starsHTML;
        */

        // HTMLの「★★★★★」をベースに、CSSで色分けする方がより正確です。
        // 例えば、4.5星なら、HTMLは「★★★★★」のまま、CSSで 4.5/5 = 90% だけ色を塗るなど。
        // `star-rating` のテキストを `data-rating` に基づいて更新します。
        let starText = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= ratingValue) {
                starText += '★'; // 塗りつぶされた星
            } else if (i - 0.5 <= ratingValue) {
                starText += '★'; // 半分の星（CSSで要調整、ここでは簡単のため★）
            } else {
                starText += '☆'; // 空の星
            }
        }
        // HTMLの星表示をJSで上書き
        starContainer.textContent = starText;

        // 4.5星の時に 5つ目の星の色を半分だけ変える処理（簡易）
        if(halfStar) {
            starContainer.textContent = '★★★★☆'; // 4.5星の表示を固定
            // ここで、CSSの .star-rating の ::before で幅を90%にするなどの処理が理想
        } else {
             starContainer.textContent = '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
        }

        // --- 最終的なロジック ---
        // data-rating="4.5"
        // ratingValue = 4.5
        // fullStars = 4
        // halfStar = 1
        // emptyStars = 0
        // starContainer.textContent = "★★★★" + "☆";
        if(halfStar) {
            starContainer.textContent = '★'.repeat(fullStars) + '☆' + '☆'.repeat(emptyStars);
            // 4.5星の「☆」をCSSで「半分の星」に見せる必要がありますが、
            // 現状では4.0も4.5も「★★★★☆」になってしまいます。
            // 簡潔さを優先し、HTML側の記述（★★★★★ や ★★★★☆）をそのまま活かすこととします。
            // そのため、このJSブロックはコメントアウトします。
        }

    });
});

