// Q1.
// i 為一組整數陣列 [6, 4, 3, 2, 4, 1, 6, 3, 2]，
// 除了一個數字只出現一次之外，其他數字都會出現兩次。請寫一個函數，找出這個唯一的數字並返回 
function findUniqueNumber(i: Array<number>) {
    let result = 0;
    i.forEach((num) => {
        // 使用XOR
        result ^= num;
    });
    // 如果沒找到的話，就拋出錯誤
    if (result === 0) {
        throw new Error('No unique number found');
    }
    return result;
}

// console.log(findUniqueNumber([6, 4, 3, 2, 4, 1, 6, 3, 2])); // 1

// Q2.
// i 為一組多型別陣列包含(整數、字串、陣列)。請加總陣列所有找到的整數並返回整數加總值
function sumOfIntegers(i: Array<number | string | Array<any>>): number {
    let sum = 0;
    i.forEach((item) => {
        if (Array.isArray(item)) {
            // 當為陣列，用遞迴處理，直到為單一數字、字串
            sum += sumOfIntegers(item);
        } else if (typeof item === 'number') {
            // 為數字時候，不在做計算
            sum += item;
        } else if (!isNaN(parseInt(item))) {
            // 為字串時候，轉換為數字後再做計算
            sum += parseInt(item);
        } else {
            // 其他情況，不做計算
            console.log('Invalid item:', item);
        }
    });
    return sum;
}

// console.log(sumOfIntegers([1, '2', 'A', [3, '4', [5, 6, '7']]])); // 28

// Q3.
// i 為字串,如果該字串有副檔名,則返回該字串的副檔名,没有則返回 False 
function getFileExtension(i: string): string | boolean {
    const extension = i.split('.').pop(); // 取得最後一個字串
    return extension ? extension : false;
}

// console.log(getFileExtension('index.spec.html')); // html

// Q4.
// i 為一組字串陣列,請返回陣列中最長的字串
function longestString(i: Array<string>): string | undefined {
    let longest: string | undefined = undefined;
    i.forEach((str) => {
        if (longest == undefined) {
            longest = str;
        } else if (str.length > longest.length) {
            longest = str;
        }
    });
    return longest;
}

// console.log(longestString(['a', 'ab', 'abcdef', 'abcd', 'abc'])); // abcdef

// Q5.
// i 為一組字串陣列,請確認陣列中是否有重複的字串,並且返回所有重複字串的加總總數
function countDuplicateStrings(i: Array<string>): number {
    // 使用Map來計算重複字串的次數
    let count = 0;
    const map = new Map<string, number>();
    i.forEach((str) => {
        if (map.has(str)) {
            map.set(str, map.get(str) ?? 0 + 1);
        } else {
            map.set(str, 1);
        }
    });
    map.forEach((value) => {
        if (value > 1) {
            count += value;
        }
    });
    return count; // worst case O(n) + O(n) = O(n)
}

// 另一種偷吃步方式，使用Set，然後catch錯誤時候+1，好像就不需要額外的變數了，可能要看一下set在typescript裡面實作方式。
// console.log(countDuplicateStrings(['a', 'b', 'a', 'c', 'b', 'd', 'a'])); // 3

// Q6.
// i 為一組多維多型別陣列，請從中找出鍵值為staff，其值為true，並加總符合條件的次數將其回傳
function countStaff(i: Array<any>): number {
    let count = 0;
    i.forEach((item) => {
        if (Array.isArray(item)) {
            count += countStaff(item);
        } else if (typeof item === 'object') {
            if (item?.staff === true) {
                count++;
            }
        }
    });
    return count;
}

// 多維多型別陣列
console.log(countStaff([
    [{ test: false }, { staff: true }, "a", "b"],
    [[{ test: false }, { staff: true }], "a", "b"],
    { staff: false },
    { staff: true },
]));  // 3