import * as fs from 'fs';
import * as path from 'path';

type InputData = {
  [key: string]: string | number | boolean | null | string[] | object | InputData;
};

type Path = string[];

// 경로 포맷팅 함수
function formatPath(path: Path): string {
  return '--' + path.join('.');
}

// 값 포맷팅 함수
function formatValue(value: any): string {
  if (Array.isArray(value)) {
    // 배열은 한 줄로 출력
    return '[' + value.map(v => JSON.stringify(v)).join(',') + ']';
  }
  return JSON.stringify(value); // 기타 타입은 그대로 문자열로 변환
}

// 객체의 각 경로를 탐색하면서 출력하기
function traverseObject(obj: InputData, path: Path = []): string[] {
  const output: string[] = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentPath = path.concat(key);
      const value = obj[key];

      if (typeof value === 'object' && !Array.isArray(value)) {
        // 객체일 경우 재귀적으로 탐색
        output.push(...traverseObject(value as InputData, currentPath));
      } else {
        // 배열이나 스칼라 값일 경우 출력
        output.push(formatPath(currentPath) + '\t' + formatValue(value));
      }
    }
  }

  return output;
}

// JSON 파일을 읽어와서 처리하는 함수
function readAndProcessFile(filePath: string): void {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('파일을 읽는 중 오류가 발생했습니다:', err);
      return;
    }

    try {
      const inputData: InputData = JSON.parse(data);
      const result = traverseObject(inputData);
      console.log(result.join('\n'));
    } catch (parseError) {
      console.error('JSON 파싱 중 오류가 발생했습니다:', parseError);
    }
  });
}

// 파일 경로 (현재 작업 디렉터리에 dump.json이 있다고 가정)
const filePath = path.resolve(__dirname, 'dump.json');

// 파일 읽기 및 처리
readAndProcessFile(filePath);
