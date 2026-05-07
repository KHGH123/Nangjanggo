import { useState } from 'react';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

export function useNfcWrite() {
    const [status, setStatus] = useState('idle'); // idle | waiting | success | error

    const write = async (url) => {
        setStatus('waiting');
        try {
            await NfcManager.start();
            await NfcManager.requestTechnology(NfcTech.Ndef);
            const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
            await NfcManager.ndefHandler.writeNdefMessage(bytes);
            setStatus('success');
        } catch {
            setStatus('error');
        } finally {
            NfcManager.cancelTechnologyRequest().catch(() => {});
        }
    };

    const cancel = () => {
        NfcManager.cancelTechnologyRequest().catch(() => {});
        setStatus('idle');
    };

    const reset = () => setStatus('idle');

    return { status, write, cancel, reset };
}
