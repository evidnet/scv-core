# SCV 사용법에 대한 매뉴얼 및 API 문서

## 목차

1. Core 설계 및 API 사용법
2. `r-base`, `ohdsi-stack`, `execution-engine` 사용법



## Core 설계 및 API 사용법

### 프로젝트 컨셉과 기능

SCV 프로젝트는 "한번에 여러개의 Docker 이미지를 템플릿으로 손쉽게 뽑아낼 수는 없을까?"라는 생각에서 프로젝트를 만들게 되었습니다. SCV는 다음과 같은걸 지원합니다.

- Docker 파일 템플릿 내 변수를 사용할 수 있습니다.
  - string, (async) function 등 자유로운 변수 치환 기능을 제공합니다.
- 병렬로 여러 개의 Docker 이미지를 동시에 생성할 수 있습니다.
- Custom Docker Registry로 쉽게 배포할 수 있습니다.
- 손쉬운 Command Line Application을 지원합니다.



### 베이스 기술

SCV 프로젝트는 다음 기술을 사용해 만들어졌습니다.

- **Environment**: Node.js
- **Language**: TypeScript / ts-node
- **Code Management**: TSLint(w/ tslint-config-standard), Prettier
- **Testing Tool**: ava
- **Libraries**: 
  - dockerode: For Build, and Deploy images.
  - fs-extra: For better filesystem APIs.
  - node-fetch: For Request HTTP APIs.
  - rimraf: For Remove file or directory.



### SCV를 사용한 콘솔 애플리케이션을 빠르게 만들어보기

1. `BaseApplication`을 상속받은 애플리케이션 class를 만듭니다.
2. 구현하고 싶은 Command를 다음과 같이 구현합니다.
   - 이미지를 빌드하기 위해 `BuildImageCommand` 추상 클래스를 상속받아 구현하기
   - 이미지를 배포하기 위해 `PublishImageCommand` 추상 클래스를 상속받아 구현하기
   - `BaseCommand` 추상 클래스를 직접 상속받아, 0부터 구현하기
3. 해당 프로젝트의 버전과 사용할 커맨드를 1에서 만든 클래스의 `version`과 `commands` 변수에 대입해줍니다.
4. 만든 Application 클래스의 인스턴스를 생성하고, `start(doParse: boolean = true, parseElement: any = process.argv): Caporal` 메소드를 통해 콘솔 애플리케이션을 시작합니다.
5. 만약 Docker 이미지를 만들 때 옵션을 커스텀하고 싶다면 `getBuildOptions (tag: string, fileName: string)`를 override해서 수정할 수 있습니다.



### 커맨드는 어떻게 만들어야할까요?

1. `BaseCommand`의 항목들을 참고하세요.

   ```ts
   abstract class BaseCommand {
     // 커맨드의 이름을 적어주면 됩니다.
     // 빌드라면 build, 정보를 가져온다면 info 등이 될 수 있겠죠?
     abstract getCommandName (): string
    
     // 커맨드의 단축어를 적어주세요.
     // 기본적으로 build의 단축어는 b, publish의 단축어는 p를 쓰고 있습니다.
     abstract getCommandAlias (): string
   
     // 이 커맨드가 어떤 일을 하는지 한줄로 적어주세요.
     abstract getCommandDescription (): string
   
     // 커맨드의 argument 목록을 넣어줍니다.
     // 어떤 것들이 들어가는지는 OptionModel 모델을 참고하세요!
     // 순서가 존재하며, required 항목을 넣어도 무시됩니다.
     // Caporal을 참고하면 도움이 됩니다.
     abstract getArguments (): Array<OptionModel>
   
     // 커맨드의 옵션(ex: -v, --version)을 넣어줍니다.
     // 어떤 것들이 들어가는지는 OptionModel 모델을 참고하세요!
     abstract getOptions (): Array<OptionModel>
   
     // Docker 이미지를 빌드할 때의 옵션들을 넣어줍니다.
     abstract getBuildOptions (tag: string, fileName: string): any
         
     // KVMap이나 Logger의 타입 정의를 참고하세요.
     // 해당 커맨드가 호출되었을 때의 callback입니다.
     // 일반 function과 async function 모두를 지원합니다.
     abstract onEvaluated (args: KVMap, options: KVMap, logger: Logger): any
   }
   ```

2. `BaseApplication`  안에 `commands`에 커맨드를 추가하면, `BaseApplication`을 시작할 때 `injectCaporal`이라는 private method를 통해 `BaseCommand`를 Caporal 안에 추가해줍니다.



### `BuildImageCommand` 속에서 변수 치환하기

`BuildImageCommand` 클래스 내에서는 다양한 변수 치환 방법을 제공합니다. `substituteMap` 프로퍼티를 통해 변수 정의 목록을 정의할 수 있습니다. `substituteMap`의 Key에는 `string`이, Value에는 `string` 혹은 `((tag: string, args?: KVMap, options?: KVMap) => string | Promise<string>)`이 올 수 있습니다.

다음 코드는 간단한 변수 치환을 정의한 예시입니다.

```typescript
export class BuildCommand extends BuildImageCommand {
  // key값에는 치환할 문자열을, value에는 변환할 값을 넣어줍니다.
  substituteMap: Map<string, TagValue> = new Map<string, TagValue>([
    ['@base', (tag: string) => `evidnet/r-base:v${tag}`],
    ['@makefilePath', 'Makefile']
  ])
  
  // ... 생략
}
```



#### Sync Function

다음 타입 정의와 같이 치환할 값으로 함수를 넣어주면, SCV에서 내부적으로 변수를 치환할 때 해당 함수를 실행하고 반환된 결과로 값을 치환합니다. 여기서 `tag`는 이미지의 `tag`이며, `args`와 `options`에는 커맨드의 실행 인자나 옵션 등이 담겨있습니다.

`type ValueFunction = ((tag: string, args?: KVMap, options?: KVMap) => string); `



#### Async Function

Sync Function과 비슷하지만, 치환될 값을 구하기 위해 비동기 작업이 필요할 때 다음 타입 정의와 같이 Async Function 또한 지원합니다.

`type AsyncValueFunction = ((tag: string, args?: KVMap, options?: KVMap) => Promise<string>);`

해당 기능은 다음과 같이 사용할 수 있습니다.

```typescript
const getVersion: TagValue = async (tag?: string) => {
  if (tag === undefined) throw new Error('Tag must be not-null!')
  
  const url = 'https://api.github.com/repos/.../.../tags?access_token=...'
  
  const response = await fetch(url)
  const body: Array<GitTag> = await response.json()
  // 1. filter as same major and minor version.
  const filtered = body.filter(gitTag => {
    const match = (index: number) =>
      (parseInt(tag.split('.')[index], 10) === parseInt(gitTag.name.replace('v', '').split('.')[index], 10))

    return match(0) && match(1)
  })
  
  // 2. map and sort it, return last one
  const results = filtered.map(gitTag => gitTag.name.replace('v', '')).sort()
  return results[results.length - 1]
}
```



## `r-base`, `ohdsi-stack`사용법

* **사전에 필요한 것**: scv-r-base로 빌드한 r-base 이미지가 로컬 Docker에 존재해야함.
* **설치 방법**:
  * Repository를 클론한다.
  * `npm install`
    `./bin/{프로젝트_이름} build`로 이미지 생성 가능. `-v` 옵션을 넣으면 로그도 확인 가능.
  * `./bin/scv-execution-engine publish $ID $PASSWORD $CUSTOM_REPOSITORY`  커맨드를 통해 이미지 업로드 가능.
* **폴더 설명**:
  - Dockerfile 템플릿 및 스크립트 등은 assets 폴더 에 있음.
  - 빌드 로직을 수정하고 싶다면 `src/commands/BuildCommand.ts`를 수정하면 됨.
  - 이미지 업로드 로직을 수정하고 싶다면 `src/commands/PublishCommand.ts`를 수정하면 됨.