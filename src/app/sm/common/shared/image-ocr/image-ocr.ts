import { Component } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { createWorker } from 'tesseract.js';
import { FormsModule } from '@angular/forms';

interface DynamicField {
    key: string;
    value: string;
}

interface DynamicTable {
    columns: string[];
    rows: Record<string, string>[];
}

interface InvoiceOCRResult {
    fields: DynamicField[];
    tables: DynamicTable[];
    rawText: string;
}

@Component({
    selector: 'app-image-ocr',

    imports: [
        FormsModule,
        SharedModule
    ],

    templateUrl: './image-ocr.html',

    styleUrl: './image-ocr.scss',

    providers: [
        MessageService,
        ConfirmationService
    ]
})
export class ImageOcr {

    extractedText = '';

    isProcessing = false;

    progress = 0;

    status = '';

    selectedFile: File | null = null;

    previewUrl = '';

    invoiceData: InvoiceOCRResult = {
        fields: [],
        tables: [],
        rawText: ''
    };


    // =========================================================
    // IMAGE SELECT
    // =========================================================

    onFileSelected(event: Event): void {

        const input =
            event.target as HTMLInputElement;

        if (!input.files || input.files.length === 0) {
            return;
        }

        const file = input.files[0];

        // Validate image

        if (!file.type.startsWith('image/')) {

            this.status =
                'Please select a valid image file.';

            this.selectedFile = null;

            return;
        }

        // Revoke old preview

        if (this.previewUrl) {

            URL.revokeObjectURL(
                this.previewUrl
            );

            this.previewUrl = '';
        }

        // Set selected file

        this.selectedFile = file;

        this.extractedText = '';

        this.progress = 0;

        this.status = 'Image selected.';

        // Reset invoice data

        this.invoiceData = {
            fields: [],
            tables: [],
            rawText: ''
        };

        // Create preview

        this.previewUrl =
            URL.createObjectURL(file);
    }


    // =========================================================
    // OCR
    // =========================================================

    async extractText(): Promise<void> {

        if (!this.selectedFile) {

            this.status =
                'Please select an invoice image.';

            return;
        }

        if (!this.selectedFile.type.startsWith('image/')) {

            this.status =
                'Please select a valid image file.';

            return;
        }


        this.isProcessing = true;

        this.progress = 0;

        this.extractedText = '';

        this.status =
            'Initializing OCR...';


        let worker: Awaited<
            ReturnType<typeof createWorker>
        > | null = null;


        try {

            // =================================================
            // CREATE OCR WORKER
            // =================================================

            worker = await createWorker(
                'eng',
                1,
                {
                    logger: (message: any) => {

                        const status =
                            message?.status || '';

                        const progress =
                            Number(message?.progress || 0);


                        if (
                            status ===
                            'recognizing text'
                        ) {

                            this.progress =
                                Math.round(
                                    progress * 100
                                );

                            this.status =
                                `Reading image... ${this.progress}%`;
                        }

                        else if (
                            status ===
                            'loading language model'
                        ) {

                            this.progress = 10;

                            this.status =
                                'Loading OCR language model...';
                        }

                        else if (
                            status ===
                            'initializing api'
                        ) {

                            this.progress = 20;

                            this.status =
                                'Initializing OCR engine...';
                        }

                    }
                }
            );


            // =================================================
            // RECOGNIZE IMAGE
            // =================================================

            this.status =
                'Reading image...';


            const result =
                await worker.recognize(
                    this.selectedFile
                );


            // =================================================
            // GET TEXT
            // =================================================

            const text =
                result.data.text?.trim() || '';


            this.extractedText =
                text;


            // =================================================
            // NO TEXT
            // =================================================

            if (!text) {

                this.invoiceData = {
                    fields: [],
                    tables: [],
                    rawText: ''
                };

                this.progress = 100;

                this.status =
                    'No text detected in image.';

                return;
            }


            // =================================================
            // EXTRACT INVOICE DATA
            // =================================================

            this.status =
                'Detecting invoice fields...';


            const fields =
                this.extractDynamicFields(
                    text
                );


            this.status =
                'Detecting invoice tables...';


            const tables =
                this.extractDynamicTables(
                    text
                );


            // =================================================
            // SAVE RESULT
            // =================================================

            this.invoiceData = {
                fields,
                tables,
                rawText: text
            };


            this.progress = 100;

            this.status =
                'Invoice extraction completed.';


            console.log(
                'OCR TEXT:',
                this.extractedText
            );


            console.log(
                'INVOICE DATA:',
                this.invoiceData
            );

        }
        catch (error) {

            console.error(
                'OCR Error:',
                error
            );


            this.status =
                'Failed to extract text from image.';


            this.extractedText = '';


            this.invoiceData = {
                fields: [],
                tables: [],
                rawText: ''
            };

        }
        finally {

            // =================================================
            // TERMINATE WORKER
            // =================================================

            if (worker) {

                try {

                    await worker.terminate();

                }
                catch (terminateError) {

                    console.error(
                        'Worker termination error:',
                        terminateError
                    );

                }
            }

            this.isProcessing = false;
        }
    }


    // =========================================================
    // DYNAMIC FIELD EXTRACTION
    // =========================================================

    private extractDynamicFields(
        text: string
    ): DynamicField[] {

        const fields: DynamicField[] = [];


        const lines =
            text
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0);


        for (const line of lines) {

            // =================================================
            // KEY : VALUE
            // =================================================

            const colonMatch =
                line.match(
                    /^(.{2,80}?)\s*:\s*(.+)$/
                );


            if (colonMatch) {

                const key =
                    colonMatch[1]
                        .trim();

                const value =
                    colonMatch[2]
                        .trim();


                if (
                    this.isValidField(
                        key,
                        value
                    )
                ) {

                    fields.push({
                        key,
                        value
                    });

                    continue;
                }
            }


            // =================================================
            // KEY - VALUE
            // =================================================

            const dashMatch =
                line.match(
                    /^(.{2,80}?)\s+[-–—]\s+(.+)$/
                );


            if (dashMatch) {

                const key =
                    dashMatch[1]
                        .trim();

                const value =
                    dashMatch[2]
                        .trim();


                if (
                    this.isValidField(
                        key,
                        value
                    )
                ) {

                    fields.push({
                        key,
                        value
                    });
                }
            }
        }


        return this.removeDuplicateFields(
            fields
        );
    }


    // =========================================================
    // VALID FIELD
    // =========================================================

    private isValidField(
        key: string,
        value: string
    ): boolean {

        if (!key || !value) {
            return false;
        }


        // Key too long

        if (key.length > 80) {
            return false;
        }


        // Value too long

        if (value.length > 500) {
            return false;
        }


        // Avoid obvious table rows

        if (
            /^\d+\s+.+\s+\d+/.test(key)
        ) {
            return false;
        }


        // Avoid lines that are mostly separators

        if (
            /^[\s\-_=]+$/.test(key)
        ) {
            return false;
        }


        return true;
    }


    // =========================================================
    // REMOVE DUPLICATE FIELDS
    // =========================================================

    private removeDuplicateFields(
        fields: DynamicField[]
    ): DynamicField[] {

        const map =
            new Map<string, DynamicField>();


        for (const field of fields) {

            const normalizedKey =
                field.key
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .trim();


            if (!map.has(normalizedKey)) {

                map.set(
                    normalizedKey,
                    field
                );
            }
        }


        return Array.from(
            map.values()
        );
    }


    // =========================================================
    // DYNAMIC TABLE DETECTION
    // =========================================================

    private extractDynamicTables(
        text: string
    ): DynamicTable[] {

        const tables: DynamicTable[] = [];


        const lines =
            text
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(Boolean);


        for (
            let i = 0;
            i < lines.length - 1;
            i++
        ) {

            const header =
                this.splitColumns(
                    lines[i]
                );


            // Header must have at least 2 columns

            if (header.length < 2) {
                continue;
            }


            const rows:
                Record<string, string>[] = [];


            let j = i + 1;


            while (
                j < lines.length
            ) {

                const columns =
                    this.splitColumns(
                        lines[j]
                    );


                // Stop table when column count changes

                if (
                    columns.length !==
                    header.length
                ) {
                    break;
                }


                const row:
                    Record<string, string> = {};


                header.forEach(
                    (column, index) => {

                        row[column] =
                            columns[index] || '';

                    }
                );


                rows.push(row);

                j++;
            }


            // Only accept tables with at least one row

            if (rows.length > 0) {

                tables.push({
                    columns: header,
                    rows
                });


                // Skip processed rows

                i = j - 1;
            }
        }


        return tables;
    }


    // =========================================================
    // SPLIT TABLE COLUMNS
    // =========================================================

    private splitColumns(
        line: string
    ): string[] {

        if (!line) {
            return [];
        }


        /*
         * OCR often produces:
         *
         * Item        Qty       Price       Total
         *
         * or:
         *
         * Item    Qty    Price    Total
         *
         */


        return line
            .split(/\s{2,}|\t+/)
            .map(column =>
                column.trim()
            )
            .filter(Boolean);
    }


    // =========================================================
    // COPY OCR TEXT
    // =========================================================

    async copyText(): Promise<void> {

        if (!this.extractedText) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                this.extractedText
            );


            this.status =
                'OCR text copied to clipboard.';

        }
        catch (error) {

            console.error(
                'Copy text error:',
                error
            );


            this.status =
                'Failed to copy OCR text.';
        }
    }


    // =========================================================
    // COPY JSON
    // =========================================================

    async copyJson(): Promise<void> {

        const json =
            this.getJson();


        try {

            await navigator.clipboard.writeText(
                json
            );


            this.status =
                'JSON copied to clipboard.';

        }
        catch (error) {

            console.error(
                'Copy JSON error:',
                error
            );


            this.status =
                'Failed to copy JSON.';
        }
    }


    // =========================================================
    // GET JSON
    // =========================================================

    getJson(): string {

        return JSON.stringify(
            this.invoiceData,
            null,
            2
        );
    }


    // =========================================================
    // DOWNLOAD JSON
    // =========================================================

    downloadJson(): void {

        const json =
            this.getJson();


        const blob =
            new Blob(
                [json],
                {
                    type:
                        'application/json;charset=utf-8'
                }
            );


        const url =
            URL.createObjectURL(blob);


        const anchor =
            document.createElement('a');


        anchor.href = url;

        anchor.download =
            'invoice-ocr.json';


        document.body.appendChild(
            anchor
        );


        anchor.click();


        document.body.removeChild(
            anchor
        );


        URL.revokeObjectURL(url);
    }


    // =========================================================
    // CLEAR
    // =========================================================

    clear(): void {

        this.selectedFile = null;

        this.extractedText = '';

        this.progress = 0;

        this.status = '';


        this.invoiceData = {
            fields: [],
            tables: [],
            rawText: ''
        };


        if (this.previewUrl) {

            URL.revokeObjectURL(
                this.previewUrl
            );

            this.previewUrl = '';
        }
    }
}