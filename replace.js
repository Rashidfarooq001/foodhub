const fs = require('fs');
const path = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldBlock =     } catch (err: any) {
      console.error('Checkout error:', err);
      setPaymentError(err.message || 'Failed to place order. Please try again.');
    } finally {;

const newBlock =     } catch (err: any) {
      console.error('Checkout error:', err);
      let msg = err.message || 'Failed to place order. Please try again.';
      if (msg.includes('Failed to fetch')) {
        msg = 'Network error or server is temporarily unavailable (502 Bad Gateway). Please try again in a few moments.';
      }
      setPaymentError(msg);
    } finally {;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully replaced block.');
} else {
    console.log('Block not found.');
}
