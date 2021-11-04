document.addEventListener('DOMContentLoaded', function () {
  !(function (o) {
    'use strict';
    o('body')
      .on('input propertychange', '.floating-label-form-group', function (i) {
        o(this).toggleClass('floating-label-form-group-with-value', !!o(i.target).val());
      })
      .on('focus', '.floating-label-form-group', function () {
        o(this).addClass('floating-label-form-group-with-focus');
      })
      .on('blur', '.floating-label-form-group', function () {
        o(this).removeClass('floating-label-form-group-with-focus');
      });
    if (992 < o(window).width()) {
      var s = o('#mainNav').height();
      o(window).on(
        'scroll',
        {
          previousTop: 0,
        },
        function () {
          var i = o(window).scrollTop();
          i < this.previousTop
            ? 0 < i && o('#mainNav').hasClass('is-fixed')
              ? o('#mainNav').addClass('is-visible')
              : o('#mainNav').removeClass('is-visible is-fixed')
            : i > this.previousTop &&
              (o('#mainNav').removeClass('is-visible'),
              s < i && !o('#mainNav').hasClass('is-fixed') && o('#mainNav').addClass('is-fixed')),
          (this.previousTop = i);
        }
      );
    }
    // eslint-disable-next-line no-undef
  })(jQuery);

  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
});

/*****************************************************************************************/
/************************************** CUSTOM *******************************************/
/*****************************************************************************************/

let test;

// eslint-disable-next-line no-undef
if (dev) {
  // window.ls.config.encrypt = true;
  window.ls.config.storage = () => {
    return false;
  };
  window.ls.config.ttl = 30;
  test = ['test1-description', { true: 343 }, 2];
  window.ls.set('test1', test);
  window.ls.set('test2', test, { encrypt: true });
  window.ls.set('test3', test, { ttl: 50 });
  window.ls.set('test4', test, { ttl: 10, encrypt: true });
  // ls.config.encrypt = true;

  window.ls.config.cb = (k) => {
    alert('Callback executed for key -> ' + k);
  };
  test = ['ff', { true: 343 }, 2];
  // console.log('test :>> ', test);

  window.ls.set(
    'testItem',
    { testObj: 'value' },
    {
      ttl: 3,
      //cb: (k) => {
      // alert('Callback executed for key -> ' + k);
      //},
    }
  );

  window.ls.set(
    'nik',
    { testObj: 'value' },
    {
      ttl: 5,
      //cb: (k) => {
      // alert('Callback executed for key -> ' + k);
      //},
    }
  );

  window.ls.set(
    'amy',
    { testObj: 'value' },
    {
      cb: (k) => {
        alert('Override for key -> ' + k);
      },
    }
  );
}
