async function test() {
    try {
        const res = await fetch('https://www.smartphonesplus.com/wp-content/uploads/2022/10/Apple-iPad-10th-Gen.jpg');
        console.log('Status:', res.status);
    } catch(e) {
        console.error('Error:', e.message);
    }
}
test();
