CVE-2026-40175

## 문제 상황
HTTP 요청 라이브러리인 Axios에서 헤더 값 검증 미흡으로 인해 CRLF 기반 Header Injection이 가능할 수 있다는 취약점이 제기되었고, 이에 대한 패치가 진행되었음

## CRLF공격이란
HTTP 헤더에 개행문자 CR(Carriage Return)/LF(Line Feed)를 입력하여 임의로 조작하여 악의적인 공격을 가하는 것

개행문자를 통해 하나의 헤더를 마치 별도의 헤더인 것처럼 보이게 할 수 있으며, 헤더에 인증정보 또는 권한정보를 포함하는 경우 이는 크게 문제가 될 수 있음

## Axios는 무엇을 잘못했는가?

Axios는 HTTP 요청을 생성할 때 사용자가 headers 객체를 통해 요청 헤더를 지정할 수 있음. 따라서 Axios가 헤더 값에 포함된 CR/LF 문자를 검증하거나 제거하지 않으면, 하나의 헤더 값이 여러 헤더 또는 별도 요청처럼 해석될 여지가 생김. 결론적으로 우회적으로 CRLF공격을 용인하게 되는 것.

실제로 Axios가 http요청을 할 때 header 검증이 결여되어 있었기에, 만약 오염된 header를 전달받는다면 Axios는 그 header를 그대로 활용하여 문제가 될 수 있었음.


### 제안서 예시 (Proof Of Concept)

보안상 취약점을 발견한 사용자는 github의 security and quality탭을 통해 이를 신고할 수 있음.

이번 패치에 활용된 제안서는 이곳임 (https://github.com/axios/axios/security/advisories/GHSA-fvcv-3m26-pcqx) 

제안서에서 활용한 예시는 아래와 같음. 

우선 이 공격 시나리오는 애플리케이션 내부에서 Object.prototype 오염이 이미 발생했다고 가정함

qs, minimist, ini, body-parser와 같은 라이브러리는 사용자 입력이나 설정 파일을 파싱하여 자바스크립트 객체를 생성함. 이 과정에서 `__proto__`, `constructor`, `prototype` 같은 특수 키가 제대로 차단되지 않으면 Prototype Pollution이 발생할 수 있음

x-amz-target 헤더가 오염되어 아래와 같은 값을 전달했다고 가정하면
```
Object.prototype['x-amz-target'] = "dummy\r\n\r\nPUT /latest/api/token HTTP/1.1\r\nHost: 169.254.169.254\r\nX-aws-ec2-metadata-token-ttl-seconds: 21600\r\n\r\nGET /ignore";
```

Axios 요청을 거침 (이때 코드 상으로는 특별히 이상한점을 발견할 수 없음)
```
// This looks safe to the developer
// axios 요청 내부 header는 이미 감염된 상태
await axios.get('https://analytics.internal/pings');
```

결론적으로 CRLF에 의해 요청 경계가 깨지면서 다음과 같은 요청 분할 형태가 가능하다고 제시되어있음
```
GET /pings HTTP/1.1
Host: analytics.internal
x-amz-target: dummy

// 아래 작성된 잘못된 예시는 AWS 메타데이터 서비스에 대한 실제 요청임
// 아래 요청을 통해 세션토큰을 반환받아 공격자가 IAM 자격증명을 탈취하고 클라우드 계정을 공격할 빌미를 줌
PUT /latest/api/token HTTP/1.1
Host: 169.254.169.254
X-aws-ec2-metadata-token-ttl-seconds: 21600

GET /ignore HTTP/1.1
...
```


### Axios는 무엇을 해야하는가?

> 내부적으로 header 검사로직 추가

제안자의 권장해결방법은 for문을 통해 axios 요청의 헤더를 감시하고, CRLF공격이 발견될 시 에러를 반환하자는 것
```
// In lib/adapters/http.js
utils.forEach(requestHeaders, function setRequestHeader(val, key) {
  if (/[\r\n]/.test(val)) {
	  // 정규식을 통해 crlf공격을 탐지하여 에러를 반환함.
    throw new Error('Security: Header value contains invalid characters');
  }
  // ... proceed to set header
});
```


제안서는 위처럼 제안 하였지만 실제 적용사항은 아래와 같음. (https://github.com/axios/axios/blob/v1.x/lib/helpers/sanitizeHeaderValue.js)
```
// 아래 문자를 제외한 문자가 나올시 invalid 처리
// Tab, HTAB 문자
// ASCII 출력 가능 문자
// obs-text, 확장 바이트 영역
const INVALID_HEADER_VALUE_CHARS_RE = /[^\x09\x20-\x7E\x80-\xFF]/g;

function sanitizeHeaderValue(str) {

// ** 핵심 로직 **
// string replace를 통해 crlf 공격 원천 차단
return trimSPorHTAB(str.replace(INVALID_HEADER_VALUE_CHARS_RE, ''));

}

  
function normalizeValue(value) {

if (value === false || value == null) {

return value;

}

// 배열이면 각 요소별로 sanitizeHeader 수행
return utils.isArray(value) ? value.map(normalizeValue) : sanitizeHeaderValue(String(value));

}

// 사용자가 사용하는 header 적용함수
// Axios 클래스 내부 헤더 세팅 함수
function setHeader(_value, _header, _rewrite) {
  const lHeader = normalizeHeader(_header);

  if (!lHeader) {
	throw new Error('header name must be a non-empty string');
  }

  const key = utils.findKey(self, lHeader);

  if (
	!key ||
	self[key] === undefined ||
	_rewrite === true ||
	(_rewrite === undefined && self[key] !== false)
  ) {
    // 헤더를 세팅하기 전 Valid 검사 함수
	assertValidHeaderValue(_value, _header);
	self[key || _header] = normalizeValue(_value);
  }
}

```

주요 차이점은 invalid한 헤더에 대해 에러로 처리할지 아니면 조용히 문자열 처리만 진행할지임.

## Axios는 왜 제안서와 다른 로직을 적용한걸까

즉 기존 제안서에서는 에러를 반환하던 것이 이제는 조용히 데이터 처리하는 것 으로 변경되었음 왤까?

그 이유는 취약점 해결 pr에서 찾을 수 있음 (https://github.com/axios/axios/pull/10660)
기능을 구현한 jasonsaayman은 처음에는 제안서 그대로 에러를 반환하는 방향으로 기능을 구현하였음
하지만 Caugner가 에러 반환 처리에 대한 우려를 표현하며 로직 방향성이 바뀌게 됨.

> According to [https://github.com/axios/axios#semver](https://github.com/axios/axios#semver), Axios follows semver.
> // Axios 는 semantic versioning을 활용하고 있다
>
> My understanding of this change is that the `setHeader()` function started throwing an error now, which it didn't before, and that this is generally considered a breaking change.
> // 현재 변경점은 setHeader에서 오류 발생 시 에러를 throw하여 처리하는것으로 보이나 이는 breaking change(이기 때문에 semantic versioning관점에 맞지않다.)
> 
> I noticed this in [mdn/mdn-http-observatory#489](https://github.com/mdn/mdn-http-observatory/pull/489), because our tests failed. For our use case in the MDN HTTP Observatory, we would prefer if `setHeader()` didn't throw, or if there was an opt-out mechanism.
> // Dependabot의 자동 업데이트 pr에서 테스트코드에서 에러가 발생했다. 우린 error를 return하지 않는 방식으로 진행되었으면 좋겠다.

Caugner가 언급한 mdn-http-observatory는 MDN 관리 하 웹사이트 보안헤더 검사도구를 제작하는 레포지토리임.

해당 서비스의 테스트코드에선 의도적으로 잘못된 헤더 값을 Axios Headers에 설정한 뒤, Observatory의 헤더 검사 로직이 이를 invalid로 판정하는지 확인했음. 그러나 Axios 1.15.0에서 setHeader 단계에서 CR/LF 포함 값을 즉시 에러처리하게 되면서, CSP 검사 로직까지 도달하기 전에 테스트가 실패했음.(https://github.com/mdn/mdn-http-observatory/actions/runs/24388577167/job/71228377175)

몇번의 코멘트 이후에 에러를 리턴하지 않고 문자열 처리만을 가미한 "Loose mode"(그들은 이렇게 부르기로 했음)로 헤더 처리 로직을 적용하는 것으로 합의하게 되었음.

>참고로 기존 mdn-http-observatory의 테스트코드에선 더이상 Axios header의 CRLF (\r\n) 공격을 테스트하지 않음. 왜냐면 이제는 Axios가  crlf 공격 가능성이 있는 헤더의 적용을 허용하지 않고 미리 처리하기 때문임. (https://github.com/mdn/mdn-http-observatory/pull/489/changes/6d3223af24ed22fdc6596ce85af4cf8862f39558)
>```
>We only set headers that we receive from a website via axios, so these headers will never contain `\r` or `\n`.
>```




## 패치사항 결론
1. Axios는 헤더 값에 포함된 CR/LF가 HTTP 요청 경계를 깨뜨리지 못하도록 방어 로직을 추가했음
2. 초기 패치에서는 CR/LF 포함 시 에러를 던지는 hard-fail 방식이 적용되었으나, 호환성 논의 이후 invalid 문자를 제거하는 sanitize 방식으로 조정되었음
3. 결과적으로 헤더 값에 CR/LF가 포함되어도 최종 요청 헤더에는 개행 문자가 남지 않도록 처리됨