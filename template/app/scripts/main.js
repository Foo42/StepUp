var app = (function () {
    'use strict';

    var touchEvent;

    var touchEvents = function () {
        if (Modernizr.touch) {
            touchEvent = 'touchstart';
        } else {
            touchEvent = 'click';
        }
    };

    var navigation = function () {
        $('.nav-toggle').on('click', function (e) {
            e.preventDefault();
            $('.nav-toggle, .main-nav').toggleClass('active');
        });

        $('.nav-tabs a').on('click', function (e) {
            e.preventDefault();
            $(this).tab('show');
        });

        $('.main-nav a, .next-slide').on(touchEvent, function (e) {
            e.preventDefault();
            var el = $(this).attr('href');
            scrollToElement(el, 500, -55, 'ease');

            $('.main-nav a').parent().removeClass('active');
            $('.nav-toggle').removeClass('active');
            $('.main-nav a[href=' + el + ']').parent().addClass('active');
        });

        function scrollToElement (selector, time, verticalOffset) {
            time = typeof(time) !== 'undefined' ? time : 1000;
            verticalOffset = typeof(verticalOffset) !== 'undefined' ? verticalOffset : 0;
            var element = $(selector);
            var offset = element.offset();
            var offsetTop = offset.top + verticalOffset;
            $('html, body').animate({
                scrollTop: offsetTop
            }, time);
        }


    };

    var init = function () {

        touchEvents();
        navigation();

    };

    return {
        init: init
    };

}());

$(function () {

    'use strict';
    app.init();

});
