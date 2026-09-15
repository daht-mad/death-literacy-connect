/* 데스티벌 신청 폼 — 모달·단독페이지 공용 (필드 5개) */
(function () {
  var PROGRAMS = [
    { v: '10/23(금) 온라인 · 데스 커넥터즈 토크', t: '10.23 (금) 온라인', d: '10:00–12:30 · Zoom 웨비나 · <b>참가비 10,000원</b>' },
    { v: '10/24(토) 오프라인 · Dive in Death', t: '10.24 (토) 오프라인', d: '14:00–19:00 · 서촌 북성재 · <b>무료</b>' }
  ];

  function formHTML(preset) {
    var picks = PROGRAMS.map(function (p) {
      var on = preset && preset === p.v ? ' checked' : '';
      return '<label class="pick"><input type="checkbox" name="programs" value="' + p.v + '"' + on + '>' +
        '<span><span class="t">' + p.t + '</span><span class="d">' + p.d + '</span></span></label>';
    }).join('');

    return '' +
      '<form class="dlc-form" novalidate>' +
      '<div class="f"><label>어느 날 오세요?<span class="req">*</span></label><div class="picks">' + picks + '</div></div>' +
      '<div class="f"><label for="dlc-name">이름<span class="req">*</span></label>' +
      '<input id="dlc-name" name="name" type="text" autocomplete="name" placeholder="홍길동"></div>' +
      '<div class="f"><label for="dlc-phone">연락처<span class="req">*</span></label>' +
      '<input id="dlc-phone" name="phone" type="tel" autocomplete="tel" placeholder="010-1234-5678"></div>' +
      '<div class="f"><label for="dlc-email">이메일<span class="req">*</span></label>' +
      '<input id="dlc-email" name="email" type="email" autocomplete="email" placeholder="me@example.com">' +
      '<div class="d" style="font-size:12px;color:rgba(0,0,0,.5);margin-top:6px">온라인 참여 시 줌 링크를 이 주소로 보내요.</div></div>' +
      '<div class="f"><label class="agree"><input type="checkbox" name="agree">' +
      '<span><b>개인정보 수집·이용</b>에 동의합니다.<span class="req">*</span><br>' +
      '<span style="opacity:.8">수집 항목: 이름·연락처·이메일·참여 프로그램 · 목적: 행사 운영과 안내 · ' +
      '보유기간: 행사 종료 후 3개월 이내 파기<br>' +
      '동의를 거부하실 수 있으며, 거부 시 온라인 신청 접수가 제한됩니다. ' +
      '신청 정보는 Airtable(미국)에 저장·관리됩니다.<br>' +
      '<a href="/privacy" target="_blank" rel="noopener">개인정보 처리방침 전문 보기</a></span>' +
      '</span></label></div>' +
      '<div class="feenote" hidden>10.23 온라인은 <b>참가비 10,000원</b>이에요. ' +
      '신청 후 입금 안내를 문자·이메일로 보내드리고, 입금이 확인되면 접수가 확정됩니다. (입금 확인을 위해 입금자명을 대조합니다.)<br>' +
      '참가비는 <b>한국 죽음문해력 지수(K-DLI) 연구</b>에 쓰이고, 신청자는 <b>다음 날 오프라인 행사에 무료로</b> 오실 수 있어요.</div>' +
      '<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button class="btn dark submit" type="submit">자리 잡기 →</button>' +
      '<div class="msg"></div>' +
      '</form>';
  }

  function utm() {
    var q = new URLSearchParams(location.search);
    return {
      utm_source: q.get('utm_source') || '',
      utm_campaign: q.get('utm_campaign') || '',
      referrer: document.referrer || ''
    };
  }

  function mount(container, preset) {
    container.innerHTML = formHTML(preset);
    var form = container.querySelector('form');
    var msg = form.querySelector('.msg');
    var btn = form.querySelector('.submit');
    var feenote = form.querySelector('.feenote');

    function syncFee() {
      var paid = Array.prototype.some.call(
        form.querySelectorAll('input[name=programs]'),
        function (i) { return i.checked && i.value.indexOf('10/23') === 0; }
      );
      if (feenote) feenote.hidden = !paid;
    }
    Array.prototype.forEach.call(form.querySelectorAll('input[name=programs]'), function (i) {
      i.addEventListener('change', syncFee);
    });
    syncFee();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'msg';
      msg.textContent = '';

      var programs = Array.prototype.slice
        .call(form.querySelectorAll('input[name=programs]:checked'))
        .map(function (i) { return i.value; });
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var email = form.email.value.trim();
      var agree = form.agree.checked;

      var bad =
        !programs.length ? '참여하실 날짜를 하나 이상 골라주세요.' :
        !name ? '이름을 적어주세요.' :
        !phone ? '연락처를 적어주세요.' :
        !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? '이메일 주소를 확인해주세요.' :
        !agree ? '개인정보 수집·이용 동의가 필요해요.' : '';
      if (bad) { msg.className = 'msg err'; msg.textContent = bad; return; }

      btn.disabled = true;
      btn.textContent = '보내는 중…';

      var payload = Object.assign(
        { name: name, phone: phone, email: email, programs: programs, agree: agree, website: form.website.value },
        utm()
      );

      fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.j && res.j.error ? res.j.error : '신청에 실패했어요.');
          var paid = programs.some(function (p) { return p.indexOf('10/23') === 0; });
          container.innerHTML =
            '<div class="dlc-form"><div class="done"><div class="big">자리 잡았어요 🎉</div>' +
            '<div class="sm">신청해주셔서 고마워요.<br>확정 안내와 세부 프로그램은 <b>' + email + '</b>으로 보내드릴게요.' +
            (paid
              ? '<br><br>10.23 온라인은 <b>참가비 10,000원</b>이에요.<br>입금 안내를 곧 보내드리고, 입금이 확인되면 접수가 확정됩니다.'
              : '') +
            '</div></div></div>';
        })
        .catch(function (err) {
          msg.className = 'msg err';
          msg.textContent = err.message || '잠시 후 다시 시도해주세요.';
          btn.disabled = false;
          btn.textContent = '자리 잡기 →';
        });
    });
  }

  function initModal() {
    var modal = document.querySelector('.dlc-modal');
    if (!modal) return;
    var body = modal.querySelector('.body');
    var opened = false;

    function open(preset) {
      if (!opened) { mount(body, preset); opened = true; }
      modal.classList.add('on');
      document.body.style.overflow = 'hidden';
      var first = body.querySelector('input');
      if (first) setTimeout(function () { first.focus(); }, 60);
    }
    function close() {
      modal.classList.remove('on');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-apply]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        open(el.getAttribute('data-apply') || '');
      });
    });
    modal.querySelector('.veil').addEventListener('click', close);
    modal.querySelector('.x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('on')) close();
    });
  }

  window.DLCApply = { mount: mount };
  document.addEventListener('DOMContentLoaded', function () {
    initModal();
    var page = document.getElementById('dlc-apply-page');
    if (page) mount(page, new URLSearchParams(location.search).get('day') || '');
  });
})();
