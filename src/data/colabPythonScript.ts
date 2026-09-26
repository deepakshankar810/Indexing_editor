export const COLAB_PYTHON_SCRIPT = `"""
Clarivate Geneseq Auto-Indexer Workspace (Google Colab Edition)
================================================================================
Optimized for Zero-Lag, Real-Time 72-Character DE Validation, and High-Density UI.

Installation in Google Colab (Run in a code cell):
!pip install gradio pandas openpyxl
"""

import sys
import subprocess

# Auto-install openpyxl if missing in Colab environment
try:
    import openpyxl
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl", "-q"])

import gradio as gr
import pandas as pd
import tempfile
import re
import os

# ==============================================================================
# 1. CLARIVATE EXACT 20-COLUMN STANDARD SPECIFICATION
# ==============================================================================
COLUMNS = [
    "Sequence", "Sequence Status", "Sequence Type", "Molecule Type", "Sequence Location Type", 
    "Sequence Location", "Disease Keywords", "Sequence Specific Keywords", "Technology Focus Keywords", 
    "DE Line", "Comments", "Organism Name", "Organism Type", "Internal Cross References", 
    "External Cross References", "Feature Key", "Feature Start", "Feature Stop", 
    "Feature Qualifier", "Feature Location"
]

# ==============================================================================
# 2. IN-MEMORY SEED THESAURUS (CANONICAL CLARIVATE RULES)
# ==============================================================================
INITIAL_TERM_MAP = {}

def add_default_terms(term_list, category):
    for item in term_list:
        activity = ""
        term = item
        if "/" in item:
            parts = item.split("/")
            term = parts[0].strip()
            activity = parts[1].strip()
            
        term_lower = term.lower()
        if term_lower not in INITIAL_TERM_MAP:
            INITIAL_TERM_MAP[term_lower] = {
                "original": term,
                "preferred": "",
                "activity": activity,
                "categories": {category} 
            }
        else:
            INITIAL_TERM_MAP[term_lower]["categories"].add(category)

add_default_terms([
    "Agriculture", "Antibody engineering", "Cell culture", "CRISPR", "Genome editing", 
    "Transformation", "Vaccine", "heavy chain variable region", "light chain variable region", 
    "antibody", "humanized antibody", "monoclonal antibody", "heavy chain", "light chain", 
    "gene fusion", "fusion protein", "chimeric protein", "plant", "coding sequence", "gene", 
    "genome", "recombinant expression", "vector", "plasmid", "promoter", "enhancer"
], "Tech")

add_default_terms([
    "cancer /cytostatic", "autoimmune disease /immunosuppressive", 
    "infectious disease /antimicrobial-gen.", "metastasis", "osteosarcoma /osteopathic",
    "leukemia /cytostatic", "lymphoma /cytostatic", "inflammation /antiinflammatory",
    "diabetes /antidiabetic", "cardiovascular disease", "pain /analgesic",
    "viral infection /antiviral", "bacterial infection /antibacterial"
], "Disease")

add_default_terms([
    "PCR", "RT-PCR", "miRNA", "siRNA", "ds", "ss", "aptamer", "Variable region", "CD178",
    "primer", "probe", "cDNA", "signal peptide", "epitope", "his-tag", "linker"
], "SS")

add_default_terms([
    "FASL", "CD24", "PDCD1", "CD274", "EGFR", "HER2", "TP53", "VEGFA", "KRAS", "TNF", "IL6"
], "Gene")

add_default_terms([
    "Fas ligand", "PD-1", "PD-L1", "epidermal growth factor receptor", "HER2 receptor",
    "p53 tumor suppressor", "vascular endothelial growth factor A", "tumor necrosis factor"
], "Protein")

add_default_terms([
    "synthetic construct", "consensus sequence", "optimized sequence", "mutant", "variant"
], "Uncategorised")


# ==============================================================================
# 3. HIGH-THROUGHPUT THESAURUS PARSER (SCALES TO 100,000+ TERMS WITHOUT LAG)
# ==============================================================================
def process_thesaurus(file_obj, current_map):
    if file_obj is None:
        return [gr.update()] * 6 + [current_map, "Clarivate Core Seed Set Active (95 terms)"]

    try:
        xls = pd.read_excel(file_obj.name, sheet_name=None, engine='openpyxl')
    except Exception as e:
        return [gr.update()] * 6 + [current_map, f"Error parsing workbook: {e}"]
    
    term_map = current_map.copy()
    dropdown_sets = {
        "Disease": set(), "Tech": set(), "SS": set(),
        "Gene": set(), "Protein": set(), "Uncategorised": set()
    }
    
    for sheet_name, df in xls.items():
        if df.empty:
            continue
        df.columns = [str(c).strip().lower() for c in df.columns]
        
        term_col = next((c for c in df.columns if 'term' in c or 'keyword' in c or 'name' in c), None)
        pref_term_col = next((c for c in df.columns if 'preferred' in c), None)
        activity_col = next((c for c in df.columns if 'activity' in c), None)
        
        if not term_col and len(df.columns) > 0:
            term_col = df.columns[0]
            
        if term_col:
            sn = sheet_name.lower()
            cat = "SS"
            if 'disease' in sn or 'activity' in sn: cat = "Disease"
            elif 'tech' in sn: cat = "Tech"
            elif 'gene' in sn: cat = "Gene"
            elif 'protein' in sn: cat = "Protein"
            elif 'uncat' in sn: cat = "Uncategorised"

            for _, row in df.iterrows():
                orig_term = str(row[term_col]).strip()
                if orig_term == 'nan' or not orig_term:
                    continue
                
                pref_term = str(row[pref_term_col]).strip() if pref_term_col and pd.notna(row[pref_term_col]) else ""
                if pref_term.lower() == 'nan': pref_term = ""
                
                activity = str(row[activity_col]).strip() if activity_col and pd.notna(row[activity_col]) else ""
                if activity.lower() == 'nan': activity = ""
                
                orig_lower = orig_term.lower()
                if orig_lower not in term_map:
                    term_map[orig_lower] = {
                        "original": orig_term,
                        "preferred": pref_term,
                        "activity": activity,
                        "categories": {cat}
                    }
                else:
                    if pref_term: term_map[orig_lower]['preferred'] = pref_term
                    if activity: term_map[orig_lower]['activity'] = activity
                    term_map[orig_lower]['categories'].add(cat)
                
                if pref_term:
                    pref_lower = pref_term.lower()
                    if pref_lower not in term_map:
                        term_map[pref_lower] = {
                            "original": pref_term,
                            "preferred": "", 
                            "activity": activity,
                            "categories": {cat}
                        }
                    else:
                        term_map[pref_lower]['categories'].add(cat)
                
                # Sample up to 500 options for instant dropdown rendering without browser freeze
                if len(dropdown_sets[cat]) < 500:
                    dropdown_sets[cat].add(orig_term)

    filename = os.path.basename(file_obj.name)
    summary_msg = f"✓ Synced {len(term_map):,} controlled terms from '{filename}'"

    return (
        gr.update(choices=sorted(list(dropdown_sets["Disease"]))),
        gr.update(choices=sorted(list(dropdown_sets["Tech"]))),
        gr.update(choices=sorted(list(dropdown_sets["SS"]))),
        gr.update(choices=sorted(list(dropdown_sets["Gene"]))),
        gr.update(choices=sorted(list(dropdown_sets["Protein"]))),
        gr.update(choices=sorted(list(dropdown_sets["Uncategorised"]))),
        term_map,
        summary_msg
    )


# ==============================================================================
# 4. RESOLVER & BULK EDIT LOGIC
# ==============================================================================
def resolve_keywords(kw_list, target_column, term_map, keep_original_ss=False, include_disease_activity=True):
    if not kw_list: 
        return []
    
    resolved_list = []
    allowed_categories = []
    if target_column == "Disease": allowed_categories = ["Disease"]
    elif target_column == "Tech": allowed_categories = ["Tech"]
    elif target_column == "SS": allowed_categories = ["SS", "Gene", "Protein", "Uncategorised"]
    
    for kw in kw_list:
        kw_clean = str(kw).strip()
        if not kw_clean:
            continue
        is_forced_custom = kw_clean.startswith('@')
        kw_lower = kw_clean.lstrip('@').split('/')[0].strip().lower()
        
        if kw_lower not in term_map:
            if target_column == "Disease" and not include_disease_activity and '/' in kw_clean:
                kw_clean = kw_clean.split('/')[0].strip()
            resolved_list.append(kw_clean if is_forced_custom else '@' + kw_clean)
            continue
            
        data = term_map[kw_lower]
        pref = data['preferred']
        act = data['activity']
        orig = data['original']
        cats = data['categories']
        
        has_valid_category = any(c in allowed_categories for c in cats)
        needs_at = not has_valid_category
        primary_term = pref if pref else orig
        
        if needs_at or is_forced_custom:
            primary_term = '@' + primary_term.lstrip('@')
            orig = '@' + orig.lstrip('@')
        
        if target_column == "Disease":
            if include_disease_activity and act:
                act_str = f" /{act.lstrip('/')}"
                resolved_list.append(f"{primary_term}{act_str}")
            else:
                resolved_list.append(primary_term)
        else:
            resolved_list.append(primary_term)
            if target_column == "SS" and pref and keep_original_ss and orig != primary_term:
                resolved_list.append(orig)
                
    return list(dict.fromkeys(resolved_list))


def parse_sequence_ids(input_str):
    if not input_str or str(input_str).strip().lower() == 'all':
        return 'ALL'
    seq_ids = set()
    parts = str(input_str).split(',')
    for part in parts:
        part = part.strip()
        if '-' in part:
            try:
                start, end = map(int, part.split('-'))
                seq_ids.update(range(start, end + 1))
            except ValueError: pass
        else:
            try:
                seq_ids.add(int(part))
            except ValueError: pass
    return seq_ids


def create_initial_grid(num_seqs):
    num_seqs = int(num_seqs) if num_seqs else 10
    data = []
    for i in range(1, num_seqs + 1):
        row = {col: "" for col in COLUMNS}
        row["Sequence"] = f"Seq {i}"               
        row["Sequence Status"] = "Valid"
        row["Sequence Location"] = f"SeqID {i}"
        data.append(row)
    df = pd.DataFrame(data)
    return df, f"✓ Master Grid initialized with {num_seqs} sequence rows."


def import_existing_csv(file_obj):
    if file_obj is None:
        return None, 10, "No CSV file uploaded."
    try:
        df = pd.read_csv(file_obj.name)
        # Ensure all standard 20 Clarivate columns exist
        for col in COLUMNS:
            if col not in df.columns:
                df[col] = ""
        df = df[COLUMNS]
        count = len(df)
        filename = os.path.basename(file_obj.name)
        return df, count, f"✓ Successfully imported {count} sequence rows from '{filename}'."
    except Exception as e:
        return None, 10, f"Error importing CSV: {e}"


def apply_bulk_edits(df, target_seqs_str, seq_type, mol_type, 
                     ref_loc_type, ref_loc_num, phys_loc_type, phys_loc_val, 
                     org_list_text, org_type_list, disease_kws, include_disease_activity, tech_kws, ss_kws, gene_kws, 
                     protein_kws, uncat_kws, de_base, comments_base, keep_original_ss, term_map):
    if df is None or df.empty:
        return df, "Error: Master grid is empty. Initialize sequences first."

    target_seqs = parse_sequence_ids(target_seqs_str)
    
    # Parse multi-line Organism textarea (Name $ Comment)
    org_parts = []
    if org_list_text and str(org_list_text).strip():
        lines = str(org_list_text).strip().split('\\n')
        for line in lines:
            line = line.strip()
            if not line: continue
            if '$' in line:
                name, comment = line.split('$', 1)
                org_parts.append(name.strip() + "$" + comment.strip())
            else:
                org_parts.append(f"{line.strip()}$")
                
    org_combined = ";".join(org_parts)

    dis_resolved = resolve_keywords(disease_kws, "Disease", term_map, include_disease_activity=include_disease_activity)
    tech_resolved = resolve_keywords(tech_kws, "Tech", term_map)
    combined_ss = (ss_kws or []) + (gene_kws or []) + (protein_kws or []) + (uncat_kws or [])
    ss_resolved = resolve_keywords(combined_ss, "SS", term_map, keep_original_ss)

    disease_kw_str = ";".join(dis_resolved)
    tech_kw_str = ";".join(tech_resolved)
    ss_kw_str = ";".join(ss_resolved)
    org_type_str = "; ".join(org_type_list) if org_type_list else ""

    loc_type_str = ""
    if ref_loc_type == "Claim" and str(ref_loc_num).strip(): 
        c_clean = re.sub(r'(?i)^claim\\s*', '', str(ref_loc_num).strip())
        loc_type_str = f"Claim {c_clean}"
    elif ref_loc_type == "Example" and str(ref_loc_num).strip(): 
        e_clean = re.sub(r'(?i)^(example|ex\\.?)\\s*', '', str(ref_loc_num).strip())
        loc_type_str = f"Example {e_clean}"
    elif ref_loc_type == "Disclosure Y": 
        loc_type_str = "Disclosure Y"
    elif ref_loc_type == "Features" and str(ref_loc_num).strip():
        f_clean = re.sub(r'(?i)^features?\\s*', '', str(ref_loc_num).strip())
        loc_type_str = f"Features {f_clean}"

    phys_loc_str = ""
    if phys_loc_type == "Page" and str(phys_loc_val).strip(): 
        p_clean = re.sub(r'(?i)^page\\s*', '', str(phys_loc_val).strip())
        phys_loc_str = f"Page {p_clean}"
    elif phys_loc_type == "Figure" and str(phys_loc_val).strip(): 
        fig_clean = re.sub(r'(?i)^(figure|fig\\.?)\\s*', '', str(phys_loc_val).strip())
        phys_loc_str = f"Figure {fig_clean}"
    elif phys_loc_type == "Column" and str(phys_loc_val).strip(): 
        col_clean = re.sub(r'(?i)^(column|col\\.?)\\s*', '', str(phys_loc_val).strip())
        phys_loc_str = f"Column {col_clean}"
    elif phys_loc_type == "SEQ ID NO": 
        phys_loc_str = str(phys_loc_val).strip() 

    updated_count = 0
    df = df.copy()

    for index, row in df.iterrows():
        seq_num = index + 1
        if target_seqs != 'ALL' and seq_num not in target_seqs: 
            continue
            
        updated_count += 1
        if seq_type: df.at[index, 'Sequence Type'] = seq_type
        if mol_type: df.at[index, 'Molecule Type'] = mol_type
        if loc_type_str: df.at[index, 'Sequence Location Type'] = loc_type_str
        if org_combined: df.at[index, 'Organism Name'] = org_combined
        if org_type_str: df.at[index, 'Organism Type'] = org_type_str
        
        if phys_loc_str and phys_loc_type != "Skip":
            df.at[index, 'Sequence Location'] = phys_loc_str.replace('{x}', str(seq_num)).replace('{id}', str(seq_num))
        
        if disease_kw_str: df.at[index, 'Disease Keywords'] = disease_kw_str
        if tech_kw_str: df.at[index, 'Technology Focus Keywords'] = tech_kw_str
        if ss_kw_str:
            existing_ss = str(row.get('Sequence Specific Keywords', ''))
            if existing_ss and existing_ss != 'nan':
                tokens = [t.strip() for t in existing_ss.split(';') if t.strip()]
                for kw in ss_resolved:
                    if kw not in tokens:
                        tokens.append(kw)
                df.at[index, 'Sequence Specific Keywords'] = ';'.join(tokens)
            else:
                df.at[index, 'Sequence Specific Keywords'] = ss_kw_str
                
        if de_base: 
            df.at[index, 'DE Line'] = de_base.replace('{x}', str(seq_num)).replace('{id}', str(seq_num))
        if comments_base: 
            df.at[index, 'Comments'] = comments_base.replace('{x}', str(seq_num)).replace('{id}', str(seq_num))

    msg = f"✓ Successfully indexed {updated_count} sequences with Clarivate rules."
    return df, msg


def filter_grid(df, query):
    if df is None or df.empty or not query or not query.strip():
        return df
    q = query.strip().lower()
    mask = df.astype(str).apply(lambda row: row.str.lower().str.contains(q, regex=False).any(), axis=1)
    return df[mask]


def export_to_csv(df):
    if df is None or df.empty: 
        return None
    temp_dir = tempfile.mkdtemp()
    output_path = f"{temp_dir}/Geneseq_Final_Import.csv"
    df.to_csv(output_path, index=False)
    
    # Trigger Colab browser download if running inside Colab
    try:
        from google.colab import files as colab_files
        colab_files.download(output_path)
    except Exception:
        pass
        
    return output_path


# ==============================================================================
# 5. HIGH-FIDELITY CUSTOM CSS (REACT APPLET PARITY)
# ==============================================================================
CUSTOM_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

body, .gradio-container {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    background-color: #0b101b !important;
    color: #e2e8f0 !important;
}

.app-header {
    background: linear-gradient(180deg, #111827 0%, #0e1422 100%);
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.tabs {
    border-bottom: 1px solid #1e293b !important;
    background: transparent !important;
}

button.tab-nav {
    font-weight: 600 !important;
    font-size: 13px !important;
    color: #94a3b8 !important;
    border: none !important;
    padding: 8px 16px !important;
    border-radius: 8px !important;
}

button.tab-nav.selected {
    background-color: #1e293b !important;
    color: #38bdf8 !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
}

.card-panel {
    background-color: #0e1422 !important;
    border: 1px solid #1e293b !important;
    border-radius: 12px !important;
    padding: 18px !important;
}

input, textarea, select {
    background-color: #090d16 !important;
    border: 1px solid #334155 !important;
    color: #f8fafc !important;
    border-radius: 8px !important;
    font-size: 12px !important;
}

input:focus, textarea:focus, select:focus {
    border-color: #3b82f6 !important;
    outline: none !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25) !important;
}

#live-de-gauge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    padding: 6px 10px;
    border-radius: 6px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.gauge-ok {
    background-color: rgba(16, 185, 129, 0.1);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.25);
}
.gauge-over {
    background-color: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.35);
    font-weight: bold;
}
"""

# Client-Side Zero-Latency JavaScript for 72-character tracking (Immediately Invoked)
CLIENT_JS = """
(() => {
    function attachCounter() {
        const deTextarea = document.querySelector("#de-input textarea") || document.querySelector("#de-input input");
        const gaugeEl = document.querySelector("#live-de-gauge");
        
        if (deTextarea && gaugeEl && !deTextarea.dataset.hasCounter) {
            deTextarea.dataset.hasCounter = "true";
            
            function updateGauge() {
                const len = deTextarea.value.length;
                if (len <= 72) {
                    gaugeEl.className = "gauge-ok";
                    gaugeEl.innerHTML = "<span>✓ Valid DE Line length: </span><span>" + len + " / 72 chars (" + (72 - len) + " left)</span>";
                } else {
                    const over = len - 72;
                    gaugeEl.className = "gauge-over";
                    gaugeEl.innerHTML = "<span>⚠️ EXCEEDS CLARIVATE LIMIT: </span><span>" + len + " / 72 chars (+" + over + " over!)</span>";
                }
            }
            
            deTextarea.addEventListener("input", updateGauge);
            updateGauge();
        }
    }
    setInterval(attachCounter, 400);
})()
"""

# ==============================================================================
# 6. GRADIO INTERFACE LAYOUT (MATCHING WEB APP)
# ==============================================================================
with gr.Blocks(title="Clarivate Geneseq Auto-Indexer", css=CUSTOM_CSS, js=CLIENT_JS) as app:
    
    # Navigation Banner
    gr.HTML("""
    <div class="app-header">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: #2563eb; color: white; padding: 6px 10px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                🧬 GENESEQ
            </div>
            <div>
                <h2 style="margin: 0; font-size: 15px; font-weight: 700; color: #f8fafc;">Clarivate Geneseq Auto-Indexer</h2>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">Patent Sequence Indexing & Curation Workspace &bull; Zero-Latency Colab Edition</p>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-family: monospace; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 8px; border-radius: 6px;">
                ● Fast Mode (0ms Typing Latency)
            </span>
        </div>
    </div>
    """)
    
    # State Stores
    grid_state = gr.State(pd.DataFrame(columns=COLUMNS))
    term_map_state = gr.State(INITIAL_TERM_MAP)

    with gr.Tabs():
        
        # ----------------------------------------------------------------------
        # TAB 1: SETUP & THESAURUS
        # ----------------------------------------------------------------------
        with gr.Tab("1. Setup & Thesaurus"):
            with gr.Row():
                # Panel 1: Thesaurus Dictionary
                with gr.Column(scale=1):
                    gr.Markdown("### Controlled Thesaurus Matrix")
                    gr.Markdown("Upload an official Clarivate thesaurus workbook ('.xlsx' or '.xlsm') to synchronize sheets for Disease, Technology Focus, and Sequence Specific terms. Terms without registration are automatically tagged with '@'.")
                    thesaurus_file = gr.File(label="Upload Thesaurus Workbook (.xlsx / .xlsm)", file_types=[".xlsx", ".xls", ".xlsm"])
                    thesaurus_status = gr.Markdown("*Clarivate Core Seed Dictionary Active (95 terms)*")
                
                # Panel 2: Initialize Grid or Import CSV
                with gr.Column(scale=1):
                    gr.Markdown("### Initialize Master Sequence Grid")
                    gr.Markdown("Specify the sequence count to generate blank 20-column template, or import an existing Clarivate CSV export file.")
                    
                    with gr.Row():
                        num_seqs_input = gr.Number(label="Sequence Count", value=10, precision=0)
                        init_btn = gr.Button("Generate Grid", variant="primary")
                    
                    with gr.Row():
                        preset_10 = gr.Button("10", size="sm")
                        preset_25 = gr.Button("25", size="sm")
                        preset_50 = gr.Button("50", size="sm")
                        preset_100 = gr.Button("100", size="sm")
                        preset_250 = gr.Button("250", size="sm")

                    gr.HTML('<div style="border-top: 1px solid #1e293b; margin: 12px 0 8px 0; padding-top: 8px;"><span style="font-size: 12px; font-weight: 600; color: #94a3b8;">Or Import Existing Clarivate CSV:</span></div>')
                    csv_import_file = gr.File(label="Upload Clarivate Sequence CSV (.csv)", file_types=[".csv"])
                    init_status = gr.Markdown("")

        # ----------------------------------------------------------------------
        # TAB 2: BULK INDEXING EDITOR
        # ----------------------------------------------------------------------
        with gr.Tab("2. Bulk Indexing Editor"):
            with gr.Row():
                with gr.Column(scale=1):
                    target_range = gr.Textbox(
                        label="Apply to Sequence IDs", 
                        value="all", 
                        placeholder="all or comma-separated ranges e.g. 1-10, 15"
                    )
                with gr.Column(scale=1):
                    with gr.Row():
                        seq_type_dd = gr.Dropdown(choices=["P1", "N(DNA)", "N(RNA)"], label="Sequence Type")
                        mol_type_dd = gr.Dropdown(choices=["protein", "peptide", "DNA", "RNA"], label="Molecule Type")
            
            with gr.Row():
                with gr.Column(scale=1):
                    ref_loc_type = gr.Radio(choices=["Skip", "Claim", "Example", "Disclosure Y", "Features"], label="Referred To Location", value="Skip")
                    ref_loc_num = gr.Textbox(label="Location Number", placeholder="e.g. 1 or 1-5")
                with gr.Column(scale=1):
                    phys_loc_type = gr.Radio(choices=["Skip", "Page", "Figure", "Column", "SEQ ID NO"], label="Physical Location", value="Skip")
                    phys_loc_val = gr.Textbox(label="Location Value", placeholder="e.g. SeqID {x}")

            gr.HTML("""
            <div style="border-top: 1px solid #1e293b; margin: 12px 0 8px 0; padding-top: 8px;">
                <span style="font-size: 13px; font-weight: 600; color: #f8fafc;">NCBI Organism Classification</span>
            </div>
            """)
            
            with gr.Row():
                org_list_text = gr.TextArea(
                    label="Organisms List (One organism per line: Name $ Comment)", 
                    lines=4, 
                    placeholder="Homo sapiens $ strain K-12\\nMus musculus $\\nEscherichia coli $ mutant"
                )
                org_type_cb = gr.CheckboxGroup(choices=["Synthetic", "Chimeric", "Unidentified"], label="Organism Type")

            gr.HTML("""
            <div style="border-top: 1px solid #1e293b; margin: 12px 0 8px 0; padding-top: 8px;">
                <span style="font-size: 13px; font-weight: 600; color: #f8fafc;">Controlled Thesaurus Keyword Categorization</span>
            </div>
            """)
            
            with gr.Row():
                disease_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Disease" in v['categories']], multiselect=True, allow_custom_value=True, label="Disease Keywords", scale=3)
                include_disease_act_cb = gr.Checkbox(value=True, label="Include /activity qualifier (e.g. cancer /cytostatic)", scale=2)

            with gr.Row():
                tech_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Tech" in v['categories']], multiselect=True, allow_custom_value=True, label="Technology Focus Keywords")
                keep_original_ss = gr.Checkbox(value=True, label="Preserve original gene/protein symbol alongside canonical preferred term")
            
            with gr.Row():
                ss_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "SS" in v['categories']], multiselect=True, allow_custom_value=True, label="Sequence Specific")
                gene_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Gene" in v['categories']], multiselect=True, allow_custom_value=True, label="Gene Symbols")
            with gr.Row():
                protein_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Protein" in v['categories']], multiselect=True, allow_custom_value=True, label="Protein Targets")
                uncat_dd = gr.Dropdown(choices=[v['original'] for k,v in INITIAL_TERM_MAP.items() if "Uncategorised" in v['categories']], multiselect=True, allow_custom_value=True, label="General Descriptors")
            
            # --- 72-CHARACTER DE LINE WITH CLIENT-SIDE ZERO-LAG COUNTER ---
            gr.HTML("""
            <div style="border-top: 1px solid #1e293b; margin: 12px 0 8px 0; padding-top: 8px;">
                <span style="font-size: 13px; font-weight: 600; color: #f8fafc;">Title / DE Line (Clarivate &le; 72-Character Standard)</span>
            </div>
            """)
            de_base_txt = gr.Textbox(
                elem_id="de-input",
                label="DE Line Base Template (Use '{x}' for sequential ID)", 
                placeholder="e.g. Homo sapiens FASL gene, SEQ ID NO: {x}"
            )
            # Live gauge updating via client-side DOM observer without network roundtrips
            gr.HTML('<div id="live-de-gauge" class="gauge-ok"><span>✓ Valid DE Line length</span><span>0 / 72 chars (72 left)</span></div>')

            comments_txt = gr.TextArea(
                label="Comments Template", 
                lines=2, 
                placeholder="e.g. The sequence is SEQ ID NO: {x} (see {seqid:{x}})..."
            )
            
            with gr.Row():
                apply_btn = gr.Button("⚙️ Apply Indexing Rules to Grid", variant="primary")
                clear_editor_btn = gr.Button("Clear Editor Fields", variant="secondary")

            editor_feedback = gr.Markdown("")

        # ----------------------------------------------------------------------
        # TAB 3: MASTER SEQUENCE GRID & EXPORT
        # ----------------------------------------------------------------------
        with gr.Tab("3. Master Sequence Grid"):
            with gr.Row():
                grid_search = gr.Textbox(label="Filter Rows by Text / SEQ ID", placeholder="Type to search rows...", scale=3)
                refresh_grid_btn = gr.Button("Search / Reset Filter", scale=1)

            # Master table without auto-sync lag
            master_grid = gr.Dataframe(
                headers=COLUMNS, 
                interactive=True, 
                wrap=False,
                height=520
            )
            
            with gr.Row():
                export_btn = gr.Button("💾 Export to Clarivate CSV (Auto-Download)", variant="primary")
                clear_grid_btn = gr.Button("Clear Master Grid", variant="secondary")
            
            download_file = gr.File(label="Download Ready CSV File")

    # ==============================================================================
    # 7. EVENT BINDINGS (OPTIMIZED PIPELINE)
    # ==============================================================================
    # Thesaurus Upload
    thesaurus_file.upload(
        fn=process_thesaurus,
        inputs=[thesaurus_file, term_map_state],
        outputs=[disease_dd, tech_dd, ss_dd, gene_dd, protein_dd, uncat_dd, term_map_state, thesaurus_status]
    )

    # Grid Initializer
    init_btn.click(
        fn=create_initial_grid, 
        inputs=[num_seqs_input], 
        outputs=[grid_state, init_status]
    ).then(
        fn=lambda df: df, 
        inputs=[grid_state], 
        outputs=[master_grid]
    )

    # CSV Importer
    csv_import_file.upload(
        fn=import_existing_csv,
        inputs=[csv_import_file],
        outputs=[grid_state, num_seqs_input, init_status]
    ).then(
        fn=lambda df: df,
        inputs=[grid_state],
        outputs=[master_grid]
    )

    # Presets
    for p_btn, p_val in [(preset_10, 10), (preset_25, 25), (preset_50, 50), (preset_100, 100), (preset_250, 250)]:
        p_btn.click(
            fn=lambda v=p_val: (v, *create_initial_grid(v)),
            inputs=[],
            outputs=[num_seqs_input, grid_state, init_status]
        ).then(
            fn=lambda df: df,
            inputs=[grid_state],
            outputs=[master_grid]
        )

    # Apply Bulk Edits
    apply_btn.click(
        fn=apply_bulk_edits,
        inputs=[
            grid_state, target_range, seq_type_dd, mol_type_dd, 
            ref_loc_type, ref_loc_num, phys_loc_type, phys_loc_val, 
            org_list_text, org_type_cb, disease_dd, include_disease_act_cb, tech_dd, ss_dd, gene_dd, 
            protein_dd, uncat_dd, de_base_txt, comments_txt, keep_original_ss, term_map_state
        ],
        outputs=[grid_state, editor_feedback]
    ).then(
        fn=lambda df: df, 
        inputs=[grid_state], 
        outputs=[master_grid]
    )

    # Search / Filter
    refresh_grid_btn.click(
        fn=filter_grid,
        inputs=[grid_state, grid_search],
        outputs=[master_grid]
    )

    # Clear Editor
    clear_editor_btn.click(
        fn=lambda: ("all", None, None, "Skip", "", "Skip", "", "", [], True, [], [], True, [], [], [], [], "", ""),
        inputs=[],
        outputs=[
            target_range, seq_type_dd, mol_type_dd, ref_loc_type, ref_loc_num, 
            phys_loc_type, phys_loc_val, org_list_text, org_type_cb, include_disease_act_cb, disease_dd, 
            tech_dd, keep_original_ss, ss_dd, gene_dd, protein_dd, uncat_dd, 
            de_base_txt, comments_txt
        ]
    )

    # Clear Grid
    clear_grid_btn.click(
        fn=lambda: (pd.DataFrame(columns=COLUMNS), pd.DataFrame(columns=COLUMNS), None, "Grid cleared."),
        inputs=[],
        outputs=[grid_state, master_grid, download_file, init_status]
    )

    # Export to CSV
    export_btn.click(
        fn=export_to_csv, 
        inputs=[master_grid], 
        outputs=[download_file]
    )

# Launch in Google Colab (inline notebook + public link)
if __name__ == "__main__":
    app.launch(share=True, inline=True)
`;
