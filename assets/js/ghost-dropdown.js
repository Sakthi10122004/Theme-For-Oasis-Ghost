document.documentElement.classList.add("js-ready");
(function($) {
    "use strict";

    /* =============================================================
       DOM LOCK: IMMEDIATE MUTATION OBSERVER
       Intercepts and hides raw [subitem] nodes before paint.
    ============================================================= */
    const hideRawNode = (node) => {
        if (node.nodeType === 1 && node.tagName === 'LI') {
            const text = node.textContent;
            if (text.includes('[subitem]') || text.includes('[has_child]')) {
                node.style.display = 'none';
                node.dataset.ghostLocked = "true";
            }
        }
    };

    document.querySelectorAll('.nebula-nav-horizontal li').forEach(hideRawNode);

    new MutationObserver((mutations) => {
        mutations.forEach((m) => {
            m.addedNodes.forEach((n) => {
                if (n.nodeType === 1) {
                    if (n.tagName === 'LI') hideRawNode(n);
                    if (n.querySelectorAll) n.querySelectorAll('li').forEach(hideRawNode);
                }
            });
        });
    }).observe(document.documentElement, { childList: true, subtree: true });

    function multiLevel(targetElement = "ul li", mLhasSubmenu = "mL-has-submenu", mLsubmenu = "mL-submenu") {
        let mLparentDetecttext = "[-]";
        let mLchildDetectText = "[--]";
        let mLdomArrayElement = [];
        let mLparentIndex = [];
        let mLparentLen = 0;

        $(`${targetElement} li`).each(function(index, element) {
            if ($(this).text().includes(mLparentDetecttext)) {
                mLparentIndex.push(index);
                mLparentLen++;

                $(this).push(element);
                if (!$(this).hasClass('menu-item-has-children')) {
                    $(this).addClass(mLhasSubmenu);
                }
                $(this).append(`<ul class="${mLsubmenu}"></ul>`);
            }
        });

        let elIndex;
        let lastMlElementText = $(`.${mLhasSubmenu}`).last().text();

        for (let i = 0; i < mLparentLen; i++) {
            elIndex = 0;

            $(`${targetElement} li`).each(function(index, element) {
                let mLsubitem = $(this).text().includes(mLchildDetectText);

                if (mLsubitem) {
                    if (elIndex + 1 >= mLparentIndex[i + 1] + 1) {
                        return false;
                    }

                    if (elIndex <= mLparentIndex[i + 1] || elIndex >= mLparentIndex[mLparentIndex.length - 1]) {
                        if (!mLparentIndex.includes(index)) {
                            mLdomArrayElement.push(element);
                            mLparentIndex.push(index);
                        }
                    }
                }
                elIndex++;
            });

            $(`.${mLhasSubmenu} ul.${mLsubmenu}:eq(${i})`).append(mLdomArrayElement);
            mLdomArrayElement = [];
        }

        let lastMlElementIndex = 0;
        let lastChildIndex = 0,
            lastChildElementText;

        $(`${targetElement} li`).each(function(index, element) {
            let lastMlElement = $(this).text().includes(lastMlElementText);

            if (lastMlElement) {
                if (!$(this).hasClass('mLlastPrentElement')) {
                    $(this).addClass('mLlastPrentElement');
                    lastChildElementText = $(this).parent().children('li').last().text();
                    lastMlElementIndex = index;
                }
            }

            if ($(this).text().includes(lastChildElementText)) {
                lastChildIndex = index;
            }

            if (lastMlElementIndex < index && lastMlElementIndex > 0) {
                $(this).addClass('mLlastChildElements');
                $(".mLlastPrentElement ul").append($(`.mLlastChildElements`));
                if (lastChildIndex == index) {
                    return false;
                }
            }
        });

        remove_text(mLhasSubmenu, mLparentDetecttext);
        remove_text('subitem', mLchildDetectText);
    }

    function remove_text(textClass, replacedText) {
        const mLhasSubmenuEL = $(`.${textClass}`);
        mLhasSubmenuEL.each(function() {
            $(this).css('display', '');
            $(this).find('li').css('display', '');

            if ($(this).find("> a:first").text().includes(replacedText)) {
                let textFull = $(this).find("> a:first").text();
                $(this).find("> a:first").text(textFull.replaceAll(replacedText, ""));
            }
        });
    }

    function initMobileDropdown() {
        function closeAllDropdowns() {
            $('.menu-item-has-children').removeClass('open');
            $('.ghost-submenu').slideUp(200);
        }

        $(document).on('click', '.menu-item-has-children > a', function(e) {
            if (window.innerWidth <= 768) {
                const $parent = $(this).parent();
                const $icon = $(e.target).closest('svg');

                if ($icon.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();

                    $('.menu-item-has-children').not($parent).removeClass('open');
                    $('.ghost-submenu').not($parent.find('.ghost-submenu')).slideUp(200);

                    $parent.toggleClass('open');
                } else {
                    closeAllDropdowns();
                }
            }
        });

        $(document).on('click', function(e) {
            if (window.innerWidth <= 768 && !$(e.target).closest('.menu-item-has-children').length) {
                closeAllDropdowns();
            }
        });

        $(window).on('resize', function() {
            let resizeTimeout;
            $(window).off('resize').on('resize', function() {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function() {
                    if (window.innerWidth > 768) {
                        $('.menu-item-has-children').removeClass('open');
                        $('.ghost-submenu').removeAttr('style');
                    }
                }, 200);
            });
        });
    }

    function initMobileMenu() {
        const $hamburger = $('.hamburger');
        const $mobileNav = $('.nebula-nav-horizontal');
        const $body = $('body');

        if ($hamburger.length && $mobileNav.length) {
            $hamburger.on('click', function(e) {
                e.stopPropagation();
                $(this).toggleClass('active');
                $mobileNav.toggleClass('active');
                $body.css('overflow', $mobileNav.hasClass('active') ? 'hidden' : '');
            });

            $mobileNav.on('click', 'a', function(e) {
                if ($(e.target).closest('svg').length > 0) {
                    return;
                }

                if (!$(this).parent().hasClass('menu-item-has-children')) {
                    $mobileNav.removeClass('active');
                    $hamburger.removeClass('active');
                    $body.css('overflow', '');
                }
            });

            $(document).on('click', function(e) {
                if (!$mobileNav.is(e.target) && $mobileNav.has(e.target).length === 0 && !$hamburger.is(e.target)) {
                    $mobileNav.removeClass('active');
                    $hamburger.removeClass('active');
                    $body.css('overflow', '');
                }
            });

            $(document).on('keydown', function(e) {
                if (e.key === 'Escape' && $mobileNav.hasClass('active')) {
                    $mobileNav.removeClass('active');
                    $hamburger.removeClass('active');
                    $body.css('overflow', '');
                }
            });
        }
    }

    function ghost_dropdown(options) {
        let defultOptions = {
            targetElement: ".nebula-nav-horizontal ul li",
            hasChildrenClasses: "menu-item-has-children",
            hasChildDetectText: "[has_child]",
            hasChildrenIcon: "<svg width='19' height='10' viewBox='0 0 19 10' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M1.74805 1.52002L9.54883 9.00002L17.3496 1.52002' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>",
            submenuUlClasses: "ghost-submenu",
            subitemDetectText: "[subitem]",
            subitemLiClasses: "subitem"
        }

        options = {
            ...defultOptions,
            ...options
        }

        let targetElement = options.targetElement;
        let hasChildrenClasses = options.hasChildrenClasses;
        let hasChildDetectText = options.hasChildDetectText;
        let hasChildrenIcon = options.hasChildrenIcon;
        let submenuUlClasses = options.submenuUlClasses;
        let subitemDetectText = options.subitemDetectText;
        let subitemLiClasses = options.subitemLiClasses;

        let parentEl = $(targetElement);
        let childEL = $(targetElement);
        let parentLen = 0;
        let domArrayElement = [];
        let indexPush = [];
        let elIndex = 0;
        let parentIndex = [];

        $(`${targetElement}`).parent().addClass('ghost-dropdown-menu');

        parentEl.each(function(index, element) {
            if ($(this).text().indexOf(hasChildDetectText) >= 0) {
                parentIndex.push(index);
                parentLen++;

                $(this).push(element);
                $(this).addClass(hasChildrenClasses);
                $(this).append(`<ul class='${submenuUlClasses}'></ul>`);
                $(targetElement).css("opacity", "1");
            }
        });

        $(targetElement).css("opacity", "1");
        $(`.${hasChildrenClasses}`).append(hasChildrenIcon);

        for (let i = 0; i < parentLen; i++) {
            elIndex = 0;

            childEL.each(function(index, element) {
                let subitem = $(this).text().includes(subitemDetectText);

                if (subitem) {
                    if (elIndex >= parentIndex[i + 1]) {
                        return false;
                    }

                    if (elIndex <= parentIndex[i + 1] || elIndex >= parentIndex[parentIndex.length - 1]) {
                        if (!indexPush.includes(index)) {
                            $(this).addClass(subitemLiClasses);
                            let st = $(this).children().text();
                            $(this).children().text(st.replaceAll(subitemDetectText, ""));
                            domArrayElement.push(element);
                            indexPush.push(index);
                        }
                    }
                }
                elIndex++;
            });

            $(`.${hasChildrenClasses} ul.${submenuUlClasses}:eq(${i})`).append(domArrayElement);
            domArrayElement = [];
        }
        remove_text(hasChildrenClasses, hasChildDetectText);

        if (options.multi_level) {
            multiLevel();
        }

        initMobileDropdown();
        initMobileMenu();
    }

    function initGhostDropdown() {
        const checkNavReady = setInterval(function() {
            const $nav = $('.nebula-nav-horizontal ul li');
            if ($nav.length > 3 && $nav.first().text().trim()) {
                clearInterval(checkNavReady);

                ghost_dropdown({
                    targetElement: ".nebula-nav-horizontal ul li",
                    hasChildrenClasses: "menu-item-has-children",
                    hasChildDetectText: "[has_child]",
                    submenuUlClasses: "ghost-submenu",
                    subitemDetectText: "[subitem]",
                    subitemLiClasses: "subitem",
                    multi_level: true,
                    mega_menu: false
                });

                document.querySelector(".nebula-nav-horizontal")?.classList.add("nav-ready");
            }
        }, 50);
    }

    $(document).ready(function() {
        initGhostDropdown();
    });

}(jQuery));

$(window).on('load pageshow', function() {
    $('body').addClass('loaded');
    $('.nebula-nav-horizontal').css({ opacity: 1, visibility: 'visible' });
});

setTimeout(() => {
    $('body').addClass('loaded');
}, 10);
